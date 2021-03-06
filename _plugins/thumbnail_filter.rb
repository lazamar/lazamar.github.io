# Title: Jekyll Thumbnail Filter
# Authors: Carlos Matallín : @matallo
#
# Description: Related posts thumbnail filter for Jekyll.
#
# Marcelo's note: It's been some time since I added this, but it
# looks like this adds a thumbnail when sharing links to Twitter and
# the like.
#
# Download: https://github.com/matallo/jekyll-thumbnail-filter
# Documentation: https://github.com/matallo/jekyll-thumbnail-filter/blob/master/README.md
# Issues: https://github.com/matallo/jekyll-thumbnail-filter/issues
#
# Syntax:  {{ post.content | thumbnail_url: post.url, post.title }}
#
# See the documentation for usage instructions.

module Jekyll
  module ThumbnailFilter
    def thumbnail_url(input, post_url, post_title)
      m = input.match(/("|'|\()(.*?\.(?:gif|jpeg|jpg|png))/)


      if m.nil?
        %|<a href="#{post_url}" alt="#{post_title}" class="thumbnail"></a>|
      else
        %|<a href="#{post_url}" style="background-image: url(#{m[2]})" alt="#{post_title}" class="thumbnail"></a>|
      end
    end
  end
end

Liquid::Template.register_filter(Jekyll::ThumbnailFilter)
