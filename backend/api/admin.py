from django.contrib import admin
from .models import CustomUser, Video, Review, ReviewUpvote, Reply, ReplyUpvote, VideoSave


# Allow view of submit_date in admin panel
class VideoAdmin(admin.ModelAdmin):
    readonly_fields = ('submit_date',)

    # Specifies the order of fields in the admin panel
    fields = (
        'youtube_id', 
        'title', 
        'channel_name', 
        'publish_date', 
        'description',
        'duration_seconds' ,
        'thumbnail_url',
        'submitted_by', 
        'submit_date',
        'is_approved'
    )

admin.site.register(CustomUser)
admin.site.register(Video, VideoAdmin)
admin.site.register(Review)
admin.site.register(ReviewUpvote)
admin.site.register(Reply)
admin.site.register(ReplyUpvote)
admin.site.register(VideoSave)