---
title: phrasing
description: this is my first post.
date: 2023-05-10
tags:
  - dev
---

## The App

Can be found <a href="https://phrasing.azurewebsites.net/#">here.</a>

The TL;DR is it's a series of interesting business phrases, impressive phrases, conversational phrases, etc organised alphabetically.

For example, under 'Conversational - I' you might find:

```diff-js
I am anxious to discharge the very onerous debt I owe you.
```

I don't know who would use it, writers maybe?

## First attempt

I was browsing <a href="https://www.gutenberg.org/">Project Gutenberg</a> earlier in the year looking for some books to download onto my iPad. I came across a book called Fifteen Thousand Useful Phrases by Grenville Kleiser which was originally published in 1910, I thought it was quite an interesting concept, and also pretty amusing imagining people saying this stuff.

It's pretty funny having a flick through some of these phrases, so many are wildly out of date and would feel really old fashioned to use them in conversation today. Some are also a little questionable, but it's an interesting snapshot of history if nothing else.

I was looking into data indexing cloud services (a string of words that would melt the frontal lobes of anyone who was alive in 1910) around the same time and thought that a search indexer of some description would be a way better method of consuming this data. Still working on the most effective method unfortunately, until such a time as that is found I'll keep it here...

## The 2023 attempt

I found myself needing to move from Dendron back to 11ty for various unimportant reasons, but that meant re-jigging this 'phrasing' thing from dendron-format to... something else. Originally the content was all just on individual half .md, half HTML files, I didn't really feel like remaking all of those individual files so decided to try to build it as some sort of Web App, or online Index, or something...

As ML/LMMs/AI is such a hot topic currently, I wanted to see if ChatGPT could help me solve this annoying problem. I ended up building out a Node.js app and publishing it to Azure.

The app turned out to be a little harder to develop than I originally anticipated, but there's honestly no way I would have gotten even 20% of the way there without ChatGPT helping...

In short the site is effectively blank, it bases its entire structure on it's input. What I gave it was something like this:

```md
# Heading 1

## Heading 2

- Data point 1
- Data point 2
- Data point 3

```

So it will take the Markdown formatted files as input from a folder called 'md_files', then build and display the data as HTML in the rendered page with an index of the headings at the top. Id like to try some different input, if I can find another data set with the same formatting (or at least easy enough to massage).
