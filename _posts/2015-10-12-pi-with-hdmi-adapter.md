---
layout: post
title: Runnning a Raspberry Pi with an HDMI adapter.
---
Well, that seems pretty trivial, right? You just connect the adapter and it
should just work. Well, it should, but it doesn't.

What in fact happens is that your adapter prevents your Pi from detecting that
there is something connected to the HDMI output, so it doesn't broadcast anything
through there and all you will see is a black screen making you wonder whether
your Pi is really working and whether you should have gone for that more expensive
adapter since this one is not working. Good news for you, it is none of the two.

There is a simple fix for that. We just need to change the Pi's "BIOS" configuration.
Well, the Raspberry Pi in fact does not have a BIOS like other bigger computers
do. It has a file called `confix.txt` which is read by the GPU before the ARM core
is initialised. All we need to do is to go to that file and uncomment the line
where it says `hdmi_safe=1`. To do that run:

{% highlight bash %}
sudo nano /boot/config.txt
{% endhighlight %}

Now look for the line where it says
```
#hdmi_safe=1
```
and remove the `#` from the beginning of the sentence.

Now press `Ctrl + X` and then press `y` and then `Enter`. Now restart your Pi
and enjoy!
