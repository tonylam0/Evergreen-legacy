from pathlib import Path
from datetime import timedelta
from dotenv import load_dotenv
import os


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv()

SECRET_KEY = os.getenv('SECRET_KEY')
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY')

# Safe way to handle
DEBUG = os.getenv('DEBUG') == 'TRUE'

# List of domain names that this django site can serve
ALLOWED_HOSTS = ['localhost', '127.0.0.1']

REST_FRAMEWORK = {
    # Tells API to look for JWT tokens for authentication.
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),

    # Authentication required for any write actions, read actions allowed for anyone
    "DEFAULT_PERMISSION_CLASSES": [ 
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
}

# Sets access and refresh token lifetime
SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=30),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=14),

    "ROTATE_REFRESH_TOKENS": True,  # Rotate refresh token after every use
    "BLACKLIST_AFTER_ROTATION": True  # Invalidates the old refresh token immediately
}

# Ensures the authentication uses JWT tokens
REST_AUTH = {
    'USE_JWT': True,
    'JWT_AUTH_COOKIE': 'my-auth-cookie',  # Optional: Name of the cookie to store the JWT
    'JWT_AUTH_REFRESH_COOKIE': 'my-refresh-cookie',  # Optional: Name of the cookie to store the refresh token
    'REGISTER_SERIALIZER': 'dj_rest_auth.registration.serializers.RegisterSerializer',
}

# Application definition

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third party apps
    'rest_framework',
    'rest_framework.authtoken',
    'dj_rest_auth',
    'corsheaders',

    # My apps
    'api',

    # Required by allauth
    'django.contrib.sites',
    'allauth',
    'allauth.account',
    'allauth.socialaccount',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'allauth.account.middleware.AccountMiddleware'
]

# List of backends that Django uses to authenticate users
AUTHENTICATION_BACKENDS = [
    # Needed to login by username in Django admin, regardless of allauth
    'django.contrib.auth.backends.ModelBackend',

    # Allauth specific authentication methods
    # Needed to login by email
    'allauth.account.auth_backends.AuthenticationBackend',
]

ROOT_URLCONF = 'backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'backend.wsgi.application'


# Database
# https://docs.djangoproject.com/en/5.2/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}


# Password validation
# https://docs.djangoproject.com/en/5.2/ref/settings/#auth-password-validators

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
# https://docs.djangoproject.com/en/5.2/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_TZ = True

# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/5.2/howto/static-files/

STATIC_URL = 'static/'

# Default primary key field type
# https://docs.djangoproject.com/en/5.2/ref/settings/#default-auto-field

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Tells Django to use custom user model
AUTH_USER_MODEL = "api.CustomUser"

# Allows React app to send its auth token
CORS_ALLOW_CREDENTIALS = True

# Will later change to production domain
CORS_ALLOWED_ORIGINS = [
    'http://localhost:3000',
    'http://127.0.0.1:3000'
]

# Required by allauth
SITE_ID = 1

ACCOUNT_LOGIN_METHODS = ['email'] 
ACCOUNT_SIGNUP_FIELDS = ['username*', 'email*', 'password1*', 'password2*']  # Ensures that email is required for signup
ACCOUNT_EMAIL_VERIFICATION = 'none' # Or 'mandatory'
ACCOUNT_UNIQUE_EMAIL = True