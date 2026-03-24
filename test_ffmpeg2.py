import ffmpeg
stream = ffmpeg.input('in.mp4').audio
args = ffmpeg.output(stream, 'out.mp3', acodec='libmp3lame', audio_bitrate='192k').get_args()
print("args:", args)
