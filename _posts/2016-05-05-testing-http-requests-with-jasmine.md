---
layout: post
title: Painlessly testing HTTP requests with Jasmine
---

Forget about setting up test servers for unit testing. Give a custom response to
any HTTP request in your code with **jasmine-ajax**.

---
**TL;DR**

Add This to your `index.html` right after your Ionic css `link` tag.

{% highlight javascript %}
<script>
    if (/Android/i.test(navigator.userAgent)) { // Check if Android
        document.write('<link href="css/android.min.css" rel="stylesheet">');
    } else if(/iPad|iPhone|iPod/.test(navigator.userAgent)){ //Check if iPhone
        document.write('<link href="css/ios.min.css" rel="stylesheet">');
    } else { //If it is neither then it is a Windows Phone.
        document.write('<link href="css/windows-phone.min.css" rel="stylesheet">');
    };
</script>
{% endhighlight %}

---

Unit testing is very important in making sure that the code we produce is really
reliable and alerting us when code changes break something. However, we must admit
that testing code with HTTP requests is not the most straight forward thing in
the world.

To begin with you may have to setup a test server that will receive the requests
from the code. Then in the server you have to check whether the request was
alright. Well, right there we are already messing things up. Our test code should
all be in one place, so that we can really test it well and automate testing.
Another alternative would be to mock the `XMLHttpRequest` object.  

Looking for scss we will find this task:
{% highlight javascript %}
gulp.task('sass', function(done) {
  gulp.src('./scss/ionic.app.scss')
    .pipe(sass())
    .on('error', sass.logError)
    .pipe(gulp.dest('./www/css/'))
    .pipe(minifyCss({
      keepSpecialComments: 0
    }))
    .pipe(rename({ extname: '.min.css' }))
    .pipe(gulp.dest('./www/css/'))
    .on('end', done);
});
{% endhighlight %}

We can see that it is using the sass command on `/scss/ionic.app.scss`, displaying any errors and throwing the output at `/www/css/`. It is also minifying the file and changing the minified version's extension to `.min.css.

Let's tell it to process everything under the `/scss/` folder by changing the source to `./scss/*`. Now it will process any scss file that we put inside the `scss` folder and output it with the other css as long as it doesn't begin with an underline. Scss files that begin with an underline are ignored by the processor.

Remember that you have to restart `ionic serve` every time you add a new scss file otherwise it will not reload when this file is changed.

## Loading the Right File

Now that we have the files we just have to load the right one. For that we will insert the `link` tag dynamically with JavaScript no we can do a check first.

Let's add that inside the `<head>` of our `index.html`. This is how it looks like:

{% highlight javascript %}
<script>
    if (/Android/i.test(navigator.userAgent)) { // Check if Android
        document.write('<link href="css/android.min.css" rel="stylesheet">');
    } else if(/iPad|iPhone|iPod/.test(navigator.userAgent)){ //Check if iPhone
        document.write('<link href="css/ios.min.css" rel="stylesheet">');
    } else { //If it is neither then it is a Windows Phone.
        document.write('<link href="css/windows-phone.min.css" rel="stylesheet">');
    };
</script>
{% endhighlight %}


 And there you go. You can do a lot more stuff than just adding different fonts. The sky is the limit.
