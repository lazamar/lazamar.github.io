function convertArticle(fromDiv, toDiv){
  htmlArticle = markdown.toHTML(fromDiv.innerHTML);
  console.log(htmlArticle);
  toDiv.innerHTML = htmlArticle;
}

mdDiv = document.getElementById("hidden");
htmlDiv = document.getElementById("content");

convertArticle(mdDiv, htmlDiv);

console.log("it is going");
