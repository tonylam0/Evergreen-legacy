from django.contrib import admin
from .models import CustomUser, Video, Review, ReviewUpvote, Reply, ReplyUpvote, VideoSave

# Register your models here.
admin.site.register(CustomUser)
admin.site.register(Video)
admin.site.register(Review)
admin.site.register(ReviewUpvote)
admin.site.register(Reply)
admin.site.register(ReplyUpvote)
admin.site.register(VideoSave)
