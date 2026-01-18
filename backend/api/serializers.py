from dj_rest_auth.registration.serializers import RegisterSerializer 
from rest_framework import serializers
from .models import Video, Review


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
