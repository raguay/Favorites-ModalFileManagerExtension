var favorites = {
  extMan: null,
  fs: null,
  init: function(extManager) {
    //
    // This function adds all the commands for working with favorites and 
    // setting up references to variables that are used.
    //
    favorites.extMan = extManager;
    favorites.fs = favorites.extMan.getLocalFS();
    var addCommand = favorites.extMan.getCommands().addCommand;
    addCommand('Go to Favorite Directory', 'favorites.gotToFavorite','Open a list of favorite directories to jump to.', favorites.goToFavorite);
    addCommand('Make Favorite Directory', 'favorites.makeFavorite','Create a favorite directory.', favorites.makeFavorite);
    addCommand('Create Alias Directory', 'favorites.createAlias','Create a directory Alias', favorites.createAlias);
    addCommand('Delete Favorite Directory','favorites.deleteFavorite','Deletes a favorite directory assignment.', favorites.deleteFavorite);
    addCommand('Delete Directory Alias','favorites.deleteAlias','Deletes a favorite directory alias.', favorites.deleteAlias);
  },
  installKeyMaps: function() {
  },
  getFavDirFile: function() {
    var fdir = favorites.fs.appendPath(favorites.fs.getHomeDir(),'.favoritedirs');
    if(!favorites.fs.dirExists(fdir)) {
      fdir = favorites.fs.appendPath(favorites.extMan.getConfigDir(),'.favoritedirs');
      if(!favorites.fs.dirExists(fdir)) {
        favorites.fs.writeFile(fdir,"");
      }
    }
    return(fdir);
  },
  getFavAliasFile: function() {
    var adir = favorites.fs.appendPath(favorites.fs.getHomeDir(),'.shortenerdirs');
    if(!favorites.fs.dirExists(adir)) {
      adir = favorites.fs.appendPath(favorites.extMan.getConfigDir(),'.shortenerdirs');
      if(!favorites.fs.dirExists(adir)) {
        favorites.fs.writeFile(adir,"");
      }
    }
    return(adir);
  },
  getFavDir: function(title, fdirs, returnFun) {
    var favs = favorites.fs.readFile(fdirs);
    favs = new String(favs).split('\n');
    var dirs = [];
    favs.forEach(fav => {
      if(fav.includes('|')) {
        var part = fav.split('|');
        dirs.push({
          name: part[0],
          value: part[1]
        })
      }
    });
    if(dirs.length > 0) favorites.extMan.getExtCommand('pickItem').command(title,dirs,returnFun);
    else favorites.extMan.getExtCommand('showMessage').command('Favorites','Sorry, no favorites defined yet.');
  },
  clearEmpties: function(ar) {
    return ar.filter(it => it.includes('|'));
  },
  goToFavorite: function() {
    favorites.getFavDir('Which Directory?', favorites.getFavDirFile(), (result) => {
      var path = favorites.fs.normalize(result);
      var match = path.match(/\{\{(.*)\}\}/);
      if(match !== null) {
        var shortDirs = new String(favorites.fs.readFile(favorites.getFavAliasFile())).split('\n');
        var sdir = shortDirs.filter(el => {
          parts = el.split('|');
          return(parts[0].includes(match[1]))
        });
        path = favorites.fs.appendPath(sdir[0].split('|')[1],path.slice(match[0].length+1,path.length));
      }
      favorites.extMan.getExtCommand('changeDir').command({
        path: path
      });
    });
  },
  makeFavorite: function() {
    //
    // Get the cursor
    //
    var cursor = favorites.extMan.getExtCommand('getCursor').command();
    favorites.extMan.getExtCommand('askQuestion').command('Favorite Directory','What do you want to name this Favorite Directory?', (result) => {
      var ndir = cursor.entry.dir.trim();
      //
      // Find all alias paths with an alias.
      //
      var sdirs = new String(favorites.fs.readFile(favorites.getFavAliasFile())).split('\n');
      sdirs.forEach(el => {
        if(el.includes('|')) {
          var parts = el.split('|');
          if(ndir.includes(parts[1])) {
            ndir = ndir.replace(parts[1],'{{'+parts[0]+'}}');
          }
        }
      });
      
      //
      // Create and add the new favorite.
      //
      var line = result.trim() + '|' + ndir;
      var fdirs = new String(favorites.fs.readFile(favorites.getFavDirFile())).split('\n');
      fdirs.push(line);
      fdirs = favorites.clearEmpties(fdirs);
      favorites.fs.writeFile(favorites.getFavDirFile(),fdirs.join('\n'));
    });
  },
  createAlias: function() {
    //
    // Get the cursor
    //
    var cursor = favorites.extMan.getExtCommand('getCursor').command();
    favorites.extMan.getExtCommand('askQuestion').command('Favorite Directory','What do you want to name this Alias?', (result) => {
      var ndir = cursor.entry.dir.trim();
      //
      // Find all alias paths with an alias.
      //
      var sdirs = new String(favorites.fs.readFile(favorites.getFavAliasFile())).split('\n');

      //
      // Create and add the new alias.
      //
      var line = result.trim() + '|' + ndir;
      sdirs.push(line);
      sdirs = favorites.clearEmpties(sdirs);
      favorites.fs.writeFile(favorites.getFavAliasFile(),sdirs.join('\n'));
    });
  },
  deleteFavorite: function() {
    favorites.getFavDir("Which Favorite to Delete?", favorites.getFavDirFile(), (result) => {
      result = result.trim();
      var sdirs = new String(favorites.fs.readFile(favorites.getFavDirFile())).split('\n');
      sdirs = sdirs.filter(item => !item.includes(result));
      favorites.fs.writeFile(favorites.getFavDirFile(),sdirs.join('\n'));
    });
  },
  deleteAlias: function() {
    favorites.getFavDir("Which Alias to Delete?", favorites.getFavAliasFile(), (result) => {
      result = result.trim();
      var sdirs = new String(favorites.fs.readFile(favorites.getFavAliasFile())).split('\n');
      sdirs = sdirs.filter(item => !item.includes(result));
      favorites.fs.writeFile(favorites.getFavAliasFile(),sdirs.join('\n'));
    });
  }
};
return(favorites);
