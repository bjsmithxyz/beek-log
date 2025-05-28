---
title: phrasing
description: A markdown-to-HTML converter app for browsing phrase collections
date: 2023-05-10
tags:
  - dev
---

## What is it

It's a straightforward app that can be found at [phrasing.azurewebsites.net](https://phrasing.azurewebsites.net/#).

The app's primary function is to take Markdown formatted files from a folder named \md_files, convert them into HTML, and display the content on the rendered page. An index of the headings is also provided at the top of the page, which is derived from the Markdown headings.

The site itself is essentially blank and bases its structure almost entirely on its input. Here's an example of the type of input the app can work with:

```md
# Heading 1

## Heading 2

- Data point 1
  - sub data point
- Data point 2
- Data point 3

```

My goal is to experiment with different data sets that can be easily formatted into the Markdown language required for input.

## Why is it called Phrasing

The app draws its name from a book of phrases, which includes interesting business expressions, impressive phrases, conversational phrases, and more.

For instance, under 'Conversational - I', you might find:

```diff-js
I am anxious to discharge the very onerous debt I owe you.
```

The app could potentially be a handy resource for writers seeking inspiration or unique phrasing.

## History stuff

Earlier in the year, while browsing Project Gutenberg, I stumbled upon a book titled 'Fifteen Thousand Useful Phrases' by Grenville Kleiser, first published in 1910. I found the book amusing, particularly envisioning people using these now-outdated phrases in everyday conversation.

The phrases offer a fascinating snapshot of history, despite many of them being archaic or slightly questionable by today's standards.

Around the same time, I was exploring data indexing cloud services. I thought that a search indexer might be a more effective way to access this treasure trove of phrases. I'm still working on the most efficient method, though.

Originally, I extracted all the content from the book's PDF. However, it became clear that remaking all the individual .md/HTML files would be labor-intensive. Consequently, I decided to develop a Web App or online Index to make the content more accessible.

With Machine Learning (ML), Language Models (LMMs), and AI being current hot topics, I turned to ChatGPT for assistance. As a result, I built a Node.js/Express.js app and published it on Azure. Despite the development process proving more challenging than anticipated, ChatGPT played a crucial role in advancing the project, and I doubt I would have gotten even 20% of the way without it...

It even wrote this.
