Image-center is a fast and reliable tool for storing and processing images for your application. Storing raw images as a file is long obsolete. Here are some of the advantage of using image center:

* Store images in MongoDB. You can use the advantage of MongoDB like replica to synchronize data between servers (CDN like).
* Fix images to specific define modes. The image will never break the design of your website because system fix the sizes automatically when a user uploads the file.
* Create different sizes of images to use it in the different part of your app.
* Optimize images with different formats like webp and serve them depends on the user's browsers automatically.
* Add watermark to the pictures.
* SVG fallback support
* Use predefined modes (profiles) for different part of your apps (post image, profile picture, banner &amp; etc)
* Create galleries. You don't need to take care of the storing images, names, and addresses, the ID of your record could be the name of the gallery here, done! It makes your data model much clear.
* Different interfaces for private and public access.

How to use it?
=============
The first step is to setup the lastest version of [nodejs](https://nodejs.org/en/) and clone the repo and run:

    npm install
    
Now you need to add modes. Mode defines the picture specifications like size, caching, watermark and fallback picture if the image does not find. You can go to `mode_tools` folder and open `modes.json`. The format is simple and clear just you have to know that each image can have different sizes (to be able to save bandwith in your server). Edit this file and run:

    node mode.js

We have to type of access **public access** and **private access**. Public access is on port **2201** and private access on port **2203**. Public access is for user, you can route your reverse proxy to this port, for example everything starts with `/image` routes to `localhost:2201`. This is an example using Nginx:
    
    server {
        listen 80;
        server_name demo.com;

        location ~ ^/image/(.*) {
            proxy_pass              http://localhost:2201;
            proxy_set_header        X-Real-IP $remote_addr;
            proxy_set_header        X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header        Host $http_host;
        }
    }

Run the public version:

    node public.js

Then user can access the images using this url:

    /image/<MODE>/<SIZE>/<NAME>

Or if you want to force sytem for specific format:

    /image/<MODE>/<SIZE>/<NAME>.<EXTENSION>

For example if you have `normal` profile with size `large` the sample access could be:

    /image/normal/large/image1
    /image/normal/large/image1.jpg
    /image/normal/large/image1.webp

Now it's the time to connect the server, run the server first:

    node server.js

Then you have a set of APIs to add image, list images and more. Here are some examples (we use [curl](https://en.wikipedia.org/wiki/CURL) to http requests).

    curl -i localhost:2203/images/<MODE>/<SIZE>?skip=<SKIP>&limit=<LIMIT>
    For example
    curl -i localhost:2203/images/normal/large
    curl -i localhost:2201/images/wide/small?skip=10&limit=20

Now to add an image:

    curl -i -F image=@file.png -F mode=normal -F name=sample -F app=nutrition localhost:2203/image

You can use HTTP FORM POST in any language to send images to image-center. Image center automatically resizes and store the image in different format and sizes after upload.

There are some other APIs like:

    curl -i localhost:2203/modes
    curl -i -X DELETE localhost:2203/image/<MODE>/<NAME>
    curl -i -X DELETE localhost:2203/image/<ID>
    
The final step if to run the optimize engine. System run optimizes engine asynchronous to be sure upload speed and performance is fast for the user, also you can set optimization for midnight or the time that you have low traffic on your server. The best way in Linux is using [crontab](https://help.ubuntu.com/community/CronHowto). Ex:

    crontab -e
    # Add this line
    0 * * * * /usr/local/bin/node /<PROJECT_PATH>/obtimize.js
    # It runs the optimize engine every hour

Fill free to ask questions or report issues :)

TODO List:
=========
* Add profile image support. The system will be able to confirm if the image is a person image or not (for some of the applications it is essential)

Copyright and license
=====================
Copyright Shenzhen Nova Technology, [http://nuofa.co](http://nuofa.co) under the Apache 2.0 license.