function MPlayer(desc) {
    this.playList = [];
    this.currentPlaying = 0;
    this.lyrics = {
        data: null,
        effect: null,
        displayMode: null,
        currentLine: 0
    };
    this.elements = {
        audio: desc.audio,
        playList: desc.playList,
        lyricPanel: desc.lyricPanel
    }
}

MPlayer.prototype.loadPlayList = function (url) {
    $.getJSON(url, function (res) {
        //console.log(res);
        this.playList = [];
        for (var i = 0; i < res.songs.length; i++) {
            var song = res.songs[i];
            this.playList.push(song);
            //$("#music-playlist ol").append('<li><a id="song_' + i + '" class="title" data-index=' + i + ' data-name="' + song.file_name + '" data-display="' + song.artist + ' - ' + song.title + '">' + song.title + '</a><br /><span class="artist">- ' + song.artist + '</span></li>');
        }
    });
};

MPlayer.prototype.parseLyrics = function (text) {
    var lines = text.split("\n");
    var regexp = /\[\d{2}:\d{2}.\d{2}\]/g;
    var result = [];
    while (!regexp.test(lines[0]) && lines.length > 0) {
        lines = lines.slice(1);
    }
    if (lines[lines.length - 1].length === 0) {
        lines.pop();
    }
    lines.forEach(function (line, i, arr_i) {
        var timeNodes = line.match(regexp);
        var lyricLine = line.replace(regexp, "");
        timeNodes.forEach(function (timeNode, j, arr_j) {
            var t = timeNode.slice(1, -1).split(":");
            result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]), lyricLine]);
        });
    });
    result.sort(function (a, b) {
        return a[0] - b[0];
    });    
    return result;
};

MPlayer.prototype.loadLyrics = function (text) {
    var player = this;
    player.lyrics.data = player.parseLyrics(text);
    player.lyrics.effect = [];
    player.lyrics.currentLine = -1;
    var parsedLyrics = player.lyrics.data;
    var domAudio = player.elements.audio[0];
    var $lyricPanel = player.elements.lyricPanel.find('#lyric-panel');
    $lyricPanel.empty();
    for (var i = 0; i < parsedLyrics.length; i++) {
        $lyricPanel.append('<p id="lyric-line-' + i + '">' + parsedLyrics[i][1] + '</p>');
    }
    var lyricPanelOffset = 290;
    $lyricPanel[0].style.top = lyricPanelOffset + "px";
    domAudio.ontimeupdate = function (e) {
        for (var i = parsedLyrics.length - 1; i >= 0; i--) {
            if (domAudio.currentTime >= parsedLyrics[i][0]) {
                if (i != player.lyrics.currentLine) {
                    player.lyrics.currentLine = i;
                    $lyricPanel.find(".active").removeClass("active");
                    var $currentLine = $lyricPanel.find("#lyric-line-" + i);
                    $currentLine.addClass("active");
                    $lyricPanel.animate({ top: (lyricPanelOffset - $currentLine[0].offsetTop) + "px" });
                }
                break;
            }
        }
    }
};

MPlayer.prototype.play = function (index) {
    var player = this;
    player.currentPlaying = index;
    var song = player.playList[index];
    $("#music-display").text(song.artist + ' - ' + song.title);
    $.get(song.lyricFile, null, function (res) {
        player.loadLyrics(res);
        var domAudio = player.elements.audio[0];
        domAudio.src = song.songFile;
        domAudio.load();
    }, 'text');
};



function playNext() {
    if (playMode === 0) {
        play((currentSongIndex + 1) % songList.length);
    }
    else if (playMode === 1) {
        play(Math.floor(Math.random() * songList.length));
    }
}

function onSongEnd() {
    playNext();
}