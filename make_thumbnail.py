from PIL import Image

maxl = 300
name = "pic_4"
img = Image.open("static/images/"+name+".png")
width, height = img.size
if min(width, height) <= maxl:
    print("small enough")
else:
    rate = maxl/min(width, height)
    print(rate)
    thumbnail = img.resize((int(width*rate), int(height*rate)), Image.LANCZOS)
    thumbnail.save("static/thumbnails/"+name+".png")