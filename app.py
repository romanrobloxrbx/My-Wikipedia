import os
import re
from datetime import datetime, timezone
from functools import wraps

from flask import Flask, abort, flash, redirect, render_template, request, url_for
from flask_login import LoginManager, UserMixin, current_user, login_required, login_user, logout_user
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import check_password_hash, generate_password_hash
from markupsafe import Markup, escape

app = Flask(__name__)
app.config["SECRET_KEY"] = os.environ.get("SECRET_KEY", "dev-only-change-this-secret")
app.config["SQLALCHEMY_DATABASE_URI"] = os.environ.get("DATABASE_URL", "sqlite:///encyclopedia.db").replace("postgres://", "postgresql://", 1)
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db = SQLAlchemy(app)
login_manager = LoginManager(app)
login_manager.login_view = "login"
login_manager.login_message_category = "info"


class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(40), unique=True, nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.String(20), nullable=False, default="registered")
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)


class Article(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(180), nullable=False)
    slug = db.Column(db.String(200), unique=True, nullable=False, index=True)
    summary = db.Column(db.String(500), nullable=False, default="")
    content = db.Column(db.Text, nullable=False, default="")
    category = db.Column(db.String(80), nullable=False, default="General")
    status = db.Column(db.String(20), nullable=False, default="published")
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    current_revision_id = db.Column(db.Integer, db.ForeignKey("revision.id", use_alter=True), nullable=True)
    revisions = db.relationship("Revision", back_populates="article", foreign_keys="Revision.article_id", order_by="Revision.created_at.desc")


class Revision(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey("article.id"), nullable=False, index=True)
    editor_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)
    title = db.Column(db.String(180), nullable=False)
    content = db.Column(db.Text, nullable=False)
    summary = db.Column(db.String(300), nullable=False, default="")
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    article = db.relationship("Article", back_populates="revisions", foreign_keys=[article_id])
    editor = db.relationship("User")


class Source(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    article_id = db.Column(db.Integer, db.ForeignKey("article.id"), nullable=False, index=True)
    title = db.Column(db.String(250), nullable=False)
    url = db.Column(db.String(1000), nullable=False)
    attribution = db.Column(db.String(500), nullable=False, default="")
    license = db.Column(db.String(200), nullable=False, default="")

class ModerationLog(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    admin_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    action = db.Column(db.String(80), nullable=False)
    details = db.Column(db.String(500), nullable=False, default="")
    created_at = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))


def admin_required(view):
    @wraps(view)
    @login_required
    def wrapped(*args, **kwargs):
        if current_user.role != "admin":
            abort(403)
        return view(*args, **kwargs)
    return wrapped


def slugify(text):
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "article"


def safe_article_html(text):
    # Small Markdown-like renderer: escapes HTML first, then adds safe formatting.
    escaped = str(escape(text))
    escaped = re.sub(r"^### (.+)$", r"<h3>\1</h3>", escaped, flags=re.M)
    escaped = re.sub(r"^## (.+)$", r"<h2>\1</h2>", escaped, flags=re.M)
    escaped = re.sub(r"^# (.+)$", r"<h1>\1</h1>", escaped, flags=re.M)
    escaped = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", escaped)
    escaped = re.sub(r"\*(.+?)\*", r"<em>\1</em>", escaped)
    blocks = [part.strip() for part in re.split(r"\n\s*\n", escaped) if part.strip()]
    rendered = []
    for block in blocks:
        if block.startswith("<h1>") or block.startswith("<h2>") or block.startswith("<h3>"):
            rendered.append(block)
        else:
            rendered.append("<p>" + block.replace("\n", "<br>") + "</p>")
    return Markup("\n".join(rendered))


@app.context_processor
def inject_globals():
    return {"render_article_content": safe_article_html}


@app.route("/")
def home():
    query = request.args.get("q", "").strip()
    featured = Article.query.filter_by(status="published").order_by(Article.updated_at.desc()).limit(6).all()
    categories = [row[0] for row in db.session.query(Article.category).filter_by(status="published").distinct().order_by(Article.category).all()]
    if query:
        return redirect(url_for("search", q=query))
    return render_template("home.html", featured=featured, categories=categories)


@app.route("/search")
def search():
    q = request.args.get("q", "").strip()
    page = request.args.get("page", 1, type=int)
    query = Article.query.filter_by(status="published")
    if q:
        like = f"%{q}%"
        query = query.filter(db.or_(Article.title.ilike(like), Article.summary.ilike(like), Article.content.ilike(like)))
    pagination = query.order_by(Article.title.asc()).paginate(page=page, per_page=10, error_out=False)
    return render_template("search.html", q=q, pagination=pagination)


@app.route("/wiki/<slug>")
def article(slug):
    item = Article.query.filter_by(slug=slug, status="published").first_or_404()
    sources = Source.query.filter_by(article_id=item.id).all()
    return render_template("article.html", article=item, sources=sources)


@app.route("/category/<path:name>")
def category(name):
    items = Article.query.filter_by(category=name, status="published").order_by(Article.title.asc()).all()
    return render_template("category.html", category_name=name, articles=items)


@app.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("home"))
    if request.method == "POST":
        username = request.form.get("username", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        if len(username) < 3 or len(username) > 40:
            flash("Username must be between 3 and 40 characters.", "error")
        elif "@" not in email or len(email) > 255:
            flash("Enter a valid email address.", "error")
        elif len(password) < 10:
            flash("Password must contain at least 10 characters.", "error")
        elif User.query.filter(db.or_(User.username.ilike(username), User.email.ilike(email))).first():
            flash("That username or email is already registered.", "error")
        else:
            user = User(username=username, email=email)
            user.set_password(password)
            db.session.add(user)
            db.session.commit()
            login_user(user)
            flash("Your account is ready. Welcome!", "success")
            return redirect(url_for("home"))
    return render_template("auth/register.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    if current_user.is_authenticated:
        return redirect(url_for("home"))
    if request.method == "POST":
        identity = request.form.get("identity", "").strip()
        password = request.form.get("password", "")
        user = User.query.filter(db.or_(User.username.ilike(identity), User.email.ilike(identity.lower()))).first()
        if user and user.check_password(password):
            login_user(user)
            flash("Welcome back.", "success")
            return redirect(request.args.get("next") or url_for("home"))
        flash("We couldn't sign you in with those details.", "error")
    return render_template("auth/login.html")


@app.route("/logout", methods=["POST"])
@login_required
def logout():
    logout_user()
    flash("You have signed out.", "info")
    return redirect(url_for("home"))


@app.route("/articles/new", methods=["GET", "POST"])
@login_required
def new_article():
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        content = request.form.get("content", "").strip()
        summary = request.form.get("summary", "").strip()
        category_name = request.form.get("category", "General").strip() or "General"
        if len(title) < 3 or len(title) > 180 or not content:
            flash("Add a title (3–180 characters) and article content.", "error")
        else:
            base = slugify(title)
            slug, suffix = base, 2
            while Article.query.filter_by(slug=slug).first():
                slug, suffix = f"{base}-{suffix}", suffix + 1
            item = Article(title=title, slug=slug, summary=summary[:500], content=content, category=category_name, status="published")
            db.session.add(item)
            db.session.flush()
            revision = Revision(article_id=item.id, editor_id=current_user.id, title=title, content=content, summary="Created article")
            db.session.add(revision)
            db.session.flush()
            item.current_revision_id = revision.id
            db.session.commit()
            flash("Article published.", "success")
            return redirect(url_for("article", slug=item.slug))
    return render_template("editor.html", article=None)


@app.route("/wiki/<slug>/edit", methods=["GET", "POST"])
@login_required
def edit_article(slug):
    item = Article.query.filter_by(slug=slug).first_or_404()
    if request.method == "POST":
        title = request.form.get("title", "").strip()
        content = request.form.get("content", "").strip()
        summary = request.form.get("summary", "").strip()
        category_name = request.form.get("category", item.category).strip() or "General"
        if len(title) < 3 or len(title) > 180 or not content:
            flash("Add a title (3–180 characters) and article content.", "error")
        else:
            item.title = title
            item.content = content
            item.summary = request.form.get("description", "").strip()[:500]
            item.category = category_name
            item.updated_at = datetime.now(timezone.utc)
            revision = Revision(article_id=item.id, editor_id=current_user.id, title=title, content=content, summary=summary[:300])
            db.session.add(revision)
            db.session.flush()
            item.current_revision_id = revision.id
            db.session.commit()
            flash("Your revision has been saved.", "success")
            return redirect(url_for("article", slug=item.slug))
    return render_template("editor.html", article=item)


@app.route("/wiki/<slug>/history")
def history(slug):
    item = Article.query.filter_by(slug=slug).first_or_404()
    revisions = Revision.query.filter_by(article_id=item.id).order_by(Revision.created_at.desc()).all()
    return render_template("history.html", article=item, revisions=revisions)


@app.route("/wiki/<slug>/history/<int:revision_id>")
def view_revision(slug, revision_id):
    item = Article.query.filter_by(slug=slug).first_or_404()
    revision = Revision.query.filter_by(id=revision_id, article_id=item.id).first_or_404()
    return render_template("revision.html", article=item, revision=revision)


@app.route("/wiki/<slug>/rollback/<int:revision_id>", methods=["POST"])
@admin_required
def rollback(slug, revision_id):
    item = Article.query.filter_by(slug=slug).first_or_404()
    old = Revision.query.filter_by(id=revision_id, article_id=item.id).first_or_404()
    revision = Revision(article_id=item.id, editor_id=current_user.id, title=old.title, content=old.content, summary=f"Admin rollback to revision {old.id}")
    item.title, item.content = old.title, old.content
    db.session.add(revision)
    db.session.flush()
    item.current_revision_id = revision.id
    db.session.add(ModerationLog(admin_id=current_user.id, action="rollback", details=f"Article {item.id} restored from revision {old.id}"))
    db.session.commit()
    flash("Revision restored as a new version.", "success")
    return redirect(url_for("article", slug=item.slug))


@app.route("/admin")
@admin_required
def admin():
    articles = Article.query.order_by(Article.updated_at.desc()).limit(50).all()
    users = User.query.order_by(User.created_at.desc()).limit(50).all()
    logs = ModerationLog.query.order_by(ModerationLog.created_at.desc()).limit(20).all()
    return render_template("admin.html", articles=articles, users=users, logs=logs)


@app.route("/admin/users/<int:user_id>/role", methods=["POST"])
@admin_required
def change_role(user_id):
    user = db.session.get(User, user_id) or abort(404)
    role = request.form.get("role")
    if role not in {"registered", "admin"}:
        abort(400)
    if user.id == current_user.id and role != "admin":
        flash("You cannot remove your own admin role here.", "error")
    else:
        user.role = role
        db.session.add(ModerationLog(admin_id=current_user.id, action="role-change", details=f"Changed {user.username} to {role}"))
        db.session.commit()
        flash(f"Updated role for {user.username}.", "success")
    return redirect(url_for("admin"))


@app.errorhandler(403)
def forbidden(_error):
    return render_template("error.html", code=403, message="You don't have permission to view this page."), 403


@app.errorhandler(404)
def not_found(_error):
    return render_template("error.html", code=404, message="We couldn't find that page."), 404


@app.cli.command("init-db")
def init_db():
    """Create database tables and a small starter library."""
    db.create_all()
    if Article.query.count() == 0:
        starter = [
            ("The Solar System", "A quick introduction to our cosmic neighborhood.", "The Solar System", "Science"),
            ("The History of Writing", "How people developed ways to record language and ideas.", "Writing systems have developed independently in different parts of the world. They help people preserve information, share ideas, and pass knowledge between generations.", "History"),
            ("Renewable Energy", "An overview of energy from naturally replenished sources.", "Renewable energy comes from sources that replenish naturally, including sunlight, wind, moving water, and geothermal heat. Each technology has different benefits and practical limitations.", "Science"),
            ("The Ocean", "Explore the largest connected ecosystem on Earth.", "The ocean covers most of Earth's surface and influences weather, climate, biodiversity, and human life. Scientists study it to understand marine ecosystems and the planet's changing climate.", "Nature"),
            ("Python Programming", "A readable, general-purpose programming language.", "Python is a general-purpose programming language known for readable syntax. It is used in web development, automation, data analysis, scientific computing, and education.", "Technology"),
            ("The Solar System", "Our star and the objects that orbit it.", "The Solar System consists of the Sun and the objects gravitationally bound to it, including eight planets, dwarf planets, moons, asteroids, and comets. This starter article is a brief overview; add and cite reliable sources before relying on it.", "Astronomy"),
        ]
        seen = set()
        for title, summary, content, category_name in starter:
            slug = slugify(title)
            if slug in seen or Article.query.filter_by(slug=slug).first():
                slug = f"{slug}-{len(seen)+1}"
            seen.add(slug)
            item = Article(title=title, slug=slug, summary=summary, content=content, category=category_name)
            db.session.add(item)
            db.session.flush()
            revision = Revision(article_id=item.id, title=title, content=content, summary="Initial sample article")
            db.session.add(revision)
            db.session.flush()
            item.current_revision_id = revision.id
        db.session.commit()
    print("Database initialized. To create an admin: register an account, then promote it using a secure database/admin procedure.")


if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=os.environ.get("FLASK_DEBUG") == "1")
