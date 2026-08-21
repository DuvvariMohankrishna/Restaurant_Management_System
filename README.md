# Restaurant Management System

A Django + Django REST Framework restaurant application with a Bootstrap and JavaScript frontend. Customers can register, log in, browse menu items, manage a cart, place cash orders, view/cancel eligible orders, and create/manage reservations.

## Features
- JWT authentication
- Public menu browsing
- Authenticated cart management
- Cash-on-delivery order workflow
- Order history and eligible cancellation
- Table reservation and availability workflow
- Staff/admin order, reservation, and payment APIs
- OpenAPI/Swagger documentation
- MySQL configuration through environment variables
- WhiteNoise static-file serving and Gunicorn production entrypoint

## Local setup
1. Create and activate a Python virtual environment.
2. Install dependencies: `pip install -r requirements.txt`
3. Copy `.env.example` to `.env` and fill in your values.
4. Create the MySQL database named in `DB_NAME`.
5. Run `python manage.py migrate`
6. Optionally create an admin user with `python manage.py createsuperuser`
7. Run `python manage.py runserver`

## Environment variables
See `.env.example`. Keep `.env` private and never commit it to Git.

## Production
The repository includes a `Procfile` and `railway.json` for a simple Railway deployment. Set all environment variables in the hosting dashboard, including `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS`, and the MySQL connection values. Run migrations during deployment using the platform's release/deployment command or shell.

Before deploying, run:
- `python manage.py migrate`
- `python manage.py collectstatic --noinput`
