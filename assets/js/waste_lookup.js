'use strict';
//data source
var URL = "https://secure.toronto.ca/cc_sr_v1/data/swm_waste_wizard_APR?limit=1000";

//Copies the html from the search result matching the title
//and adds it to the 'favourites' section
function addFav(title) {
    $("#favourites div.Results").append(
        '<div class="searchResult">' +
        $(this).parents("div.searchResult").html() +
        '</div>'
    );
    $("#favourites").css("display", "block");
}

//Takes a set of keywords and search terms to find a match between them
//If a match is found, adds the title and description to index.html
function addIfMatch(keywords, searchTerms, jsonItem) {
    for (var i = 0; i < searchTerms.length; i++) {
        for (var j = 0; j < keywords.length; j++) {
            //if the search term equals the keyword
            //Matches the base letter (case insensitive)
            //e.g. E = e, é = e, e != d
            if (!searchTerms[i].localeCompare(keywords[j], undefined, { sensitivity: 'base' })) {
                var result = {
                    "title": jsonItem.title,
                    "desc": htmlDecode(jsonItem.body)
                };
                //adds the title and description to index.html
                addSearchResult(result);
                return true;
            }
        }
    }
    return false;
}

//Adds the found searchResult to index.html in the proper format
function addSearchResult(searchResult) {
    var appendStr = "";
    appendStr =
        '<div class="searchResult">' +
        '<div class="button">' +
        '<i class="fas fa-star';
    //if the result is in the favourites list, add class 'selected' to the icon
    if (getSearchResult($("#favourites"), searchResult.title)) {
        appendStr += ' selected';
    }
    appendStr += '"></i>' +
        '</div>' +
        '<div class="itemTitle">' + searchResult.title + '</div>' +
        '<div class="itemDesc">';
    //if the result is already in a html list structure, add as is
    //else, add the html list structure
    if (searchResult.desc.slice(1, 3) === "ul") {
        appendStr += searchResult.desc + '</div></div>';
    }
    else {
        appendStr += '<ul><li>' + searchResult.desc + '</li></ul>';
    }
    $("#searchContainer").append(appendStr);
}

//Takes a string and returns an array of individual words
//Breaks up hyphenated words into two words
function getKeywords(keyString) {
    //breaks the string based on any size set of non-latin characters
    //inlcudes both english and french accented characters
    keyString = keyString.trim().split(/[^a-zA-Z0-9\u00C0-\u024F]+/);
    //if the last character in the string was a non-latin character
    //then a empty string was returned, so it needs to be 'popped'
    if (keyString[keyString.length - 1] === "") {
        keyString.pop();
    }
    return keyString;
}

//Returnes a jquery object of the search result
//given the title of the result and its section 
//in the DOM
function getSearchResult($location, title) {
    var $searchResults = $location.find(".searchResult");
    for (var i = 0; i < $searchResults.length; i++) {
        if ($searchResults.eq(i).find(".itemTitle").text() === title) {
            return $searchResults.eq(i);
        }
    }
    return false;
}

function htmlDecode(input) {
    var doc = new DOMParser().parseFromString(input, "text/html");
    return doc.documentElement.textContent;
}

//Given a title, removes the matching result
//from the 'favourites' section
function removeFav(title) {
    var $searchResult = getSearchResult($("#favourites"), title);
    if ($searchResult) {
        $searchResult.remove();
        removeStar(title);
    }
    else {
        console.log("Could not find result");
        return false;
    }
}

//Removes the class 'selection' from a star icon
function removeStar(title) {
    var $searchResult = getSearchResult($("#searchContainer"), title);
    $searchResult.find("i.fa-star").removeClass('selected');
}

//Searchs the JSON data for results based on the
//given keywords. Adds any results to index.html
function search(searchTerms) {
    //gets JSON data from URL and cycles through each entry
    $.getJSON(URL, function (data) {
        var match = 0;
        data.forEach(function (jsonItem) {
            //If no match of the search terms in the title, then
            //check for match in the keywords
            //If a match in either, add the result to index.html and continue
            if (addIfMatch(getKeywords(jsonItem.title), searchTerms, jsonItem)) {
                match++;
                return;
            }
            else if (addIfMatch(getKeywords(jsonItem.keywords), searchTerms, jsonItem)){
                match++;
            }
        });
        if (!match) {
            $("#searchContainer").append("<p>No search results found</p>");
        }
    });
    //to delete?
    $("#searchContainer").html("");
}

//Runs the search function anytime the 'enter' key
//is pressed while focused on the search bar
$("input").on("keypress", function (event) {
    if (event.which == 13) {
        var keywords = getKeywords($("input").val());
        search(keywords);
    }
})

//Clears the search results once the user clears the search bar
$("input").on("input", function () {
    if ($("input[type=text]").val() === "") {
        $("#searchContainer").html("");
    }
})

//Runs the search function anytime the search button is clicked
$("#searchBar button").on("click", function () {
    var keywords = getKeywords($("input").val());
    search(keywords);
})

//Toggles the favourite button and
//adds/removes the search result from the favourites section
$("div.Results").on("click", "i.fa-star", function () {
    $(this).toggleClass("selected");
    var title = $(this).parent().siblings("div.itemTitle").text();
    if ($(this).hasClass("selected")) {
        addFav.call(this, title);
    }
    else {
        removeFav(title);
    }
})