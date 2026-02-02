from dj_rest_auth.registration.serializers import RegisterSerializer
from django.contrib.auth import authenticate
from rest_framework import serializers
from .models import CustomUser, Video, Review

# Validates incoming video submission data and converts it into/from JSON
class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = '__all__'

# For reviews
class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = '__all__'

class CustomRegisterSerializer(RegisterSerializer):
    def validate_email(self, value):
        email = value.lower()

        if CustomUser.objects.filter(email=email).exists():
            raise serializers.ValidationError("A user with this email already exists.")

        return email

class CustomLoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=True)
    password = serializers.CharField(
        required=True,
        trim_whitespace=False
    )

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')

        if email and password:
            # Authenticate the user
            user = authenticate(request=self.context.get('request'),
                               email=email, password=password)

            print(f"Attempting auth for: {email}. Result: {user}")

            if not user:
                print(f"Attempting auth for: {email}. Result: {user}")
                raise serializers.ValidationError("Unable to log in with provided credentials.")
        else:
            raise serializers.ValidationError("Must include 'email' and 'password'.")

        attrs['user'] = user
        return attrs
