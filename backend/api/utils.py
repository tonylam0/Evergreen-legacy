import re


def extract_video_id(url):
    youtube_regex = (
        r'(?:v=|\/)([0-9A-Za-z_-]{11}).*'  # Valid YouTube video ID format
    )

    match = re.search(youtube_regex, url)
    if match:
        return match.group(1)  # Returns only the video ID from the URL
    return None

# Parse YouTube duration into seconds
def parse_duration(duration):
    match = re.match(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', duration)

    if not match:
        return None
    
    hours = int(match.group(1) or 0)
    minutes = int(match.group(2) or 0)
    seconds = int(match.group(3) or 0)

    return hours * 3600 + minutes * 60 + seconds
