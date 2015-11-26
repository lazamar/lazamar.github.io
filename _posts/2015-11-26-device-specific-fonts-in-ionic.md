---
layout: post
title: Device Specific Fonts in Ionic
---

Building apps that have appropriate looks on iPhone and Android is a breeze with Ionic.
But sometimes we need more than `.platform-android` and `.platform-ios`. We need device-specific css files.

---
**TL;DR**

Add This to your `index.html` right after your Ionic css `link` tag.

{% highlight javascript %}
<script>
    if (/Android/i.test(navigator.userAgent)) { // Check if is Android
        document.write('<link href="css/android.min.css" rel="stylesheet">');
    } else if(/iPad|iPhone|iPod/.test(navigator.userAgent)){
        document.write('<link href="css/ios.min.css" rel="stylesheet">');
    } else {
        document.write('<link href="css/windows-phone.min.css" rel="stylesheet">');
    };
</script>
{% endhighlight %}

---

The best thing about having different css files is dealing with icon fonts.
You can declare in your whole app that icons use the font `myIconFont` and depending on the device you choose whether to point `myIconFont` to `iosIcons.woff` or to `androidIcons.woff`.
This way we don't need different classes or even to specify different contents class in each class based on the platform.
We only need right character mapping in both fonts. If in one `$` was the home symbol for iOS, in the other it should be the home symbol for Android.


## Additional .scss files
You could just put your additional css files under `www/css`, but if we want to use scss and have it auto-processed when using `serve` as well as live reloading on code changes we better get our configuration right.

By default Ionic converts only the `ionic.app.scss` file into css. To get extra files into that mix we need to give a look at our `gulpfile.js` and check what it is doing.

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
    if (/Android/i.test(navigator.userAgent)) { // Check if is Android
        document.write('<link href="css/android.min.css" rel="stylesheet">');
    } else if(/iPad|iPhone|iPod/.test(navigator.userAgent)){ //Check if is iPhone
        document.write('<link href="css/ios.min.css" rel="stylesheet">');
    } else { //If it is neither then it is a Windows Phone.
        document.write('<link href="css/windows-phone.min.css" rel="stylesheet">');
    };
</script>
{% endhighlight %}


 And there you go. You can do a lot more stuff than just adding different fonts. The sky is the limit. 
