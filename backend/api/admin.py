from django.contrib import admin
from .models import CustomUser, Video, Review, ReviewUpvote, Reply, ReplyUpvote


# Allow view of submit_date in admin panel
class VideoAdmin(admin.ModelAdmin):
    readonly_fields = ('submit_date','id')  # Must be a tuple

    # Specifies the order of fields in the admin panel
    fields = (
        'id',
        'youtube_id', 
        'title', 
        'channel_name', 
        'publish_date', 'description', 'duration_seconds' , 'thumbnail_url',
        'submitted_by', 
        'submit_date',
        'is_approved'
    )

class ReviewAdmin(admin.ModelAdmin):
    readonly_fields = ('created_at','id')  

    fields = (
        'id',
        'author',
        'video',
        'review_text',
        'rating',
        'created_at'
    )

admin.site.register(CustomUser)
admin.site.register(Video, VideoAdmin)
admin.site.register(Review, ReviewAdmin)
admin.site.register(ReviewUpvote)
admin.site.register(Reply)
admin.site.register(ReplyUpvote)
