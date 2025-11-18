from rest_framework import serializers
from .models import Video


# Validates incoming video submission data and converts it into/from JSON
class VideoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Video
        fields = '__all__'