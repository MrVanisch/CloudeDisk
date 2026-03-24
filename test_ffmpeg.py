import sys
import subprocess

# Install ffmpeg-python in a local venv and test it
subprocess.run([sys.executable, "-m", "pip", "install", "ffmpeg-python"])

import ffmpeg
args1 = ffmpeg.output(ffmpeg.input('in.mp4'), 'out.mp3', vn=True).get_args()
args2 = ffmpeg.output(ffmpeg.input('in.mp4'), 'out.mp3', vn=None).get_args()
args3 = ffmpeg.output(ffmpeg.input('in.mp4'), 'out.mp3', **{'vn': None}).get_args()

print("args1:", args1)
print("args2:", args2)
print("args3:", args3)
