from flask import Flask


def create_app(config_object="config.Config"):
    """Create the local-development Flask application.

    Production is deployed as a static GitHub Pages site. Flask remains a
    supported local development server and must not collect visitor telemetry.
    """
    app = Flask(__name__)
    app.config.from_object(config_object)

    from . import routes

    app.register_blueprint(routes.main)
    return app
