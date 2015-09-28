---
layout: post
title: My first post
---
Well, there you go.

- Now we can see
- how cool it is to write
> Using markdown
> In everything.

I can even add some code snippets:
{% highlight javascript %}
      angular.module('must', ['ionic', 'must.controllers', 'must.services','must.directives'])

      .run(function($ionicPlatform) {
        $ionicPlatform.ready(function() {
          // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
          // for form inputs)
          if (window.cordova && window.cordova.plugins && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
            cordova.plugins.Keyboard.disableScroll(true);

          }
          if (window.StatusBar) {
            // org.apache.cordova.statusbar required
            StatusBar.styleLightContent();
          }
        });
      })
{% endhighlight %}
See. It works like a charm
