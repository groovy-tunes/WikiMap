# WikiMap
WikiMap is a one path API for getting the coordinates of locations in a wikipedia article. Initially I created this with the idea of quickly mapping out locations from movies and books so I could have a better geographical context of the stories, but I later generalized it to all Wikipedia articles with a 'Plot' section. WikiMap is built with node.js and Express for the server, utilizes the Wikipedia API to pull article data, and Wit.ai for parsing out locations in article text. 

# Usage
To use it, download the repo and then use npm start. Visiting the url localhost:3000 will return the locations from the movie "London Has Fallen", and for any other movie, visit localhost:3000/<Target Movie/Book> with the spaces replaced with underscores in the title.
