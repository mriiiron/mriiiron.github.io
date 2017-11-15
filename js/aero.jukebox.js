function parseLyrics(text) {
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
}

var songList = [],
    currentSongIndex = -1;

var domAudio = $("audio#player")[0],
    domLyricShow = $("#music-lyric-show")[0],
    jLyricPanel = $("#lyric-panel"),
    lyrics = null,
    lyricEffects = null,
    playMode = 0,
    lyricDisplayMode = 0,
    isEffectAvailable = false,
    currentLyricLine = -1;

function loadPlayList(jsonPlayList, callback) {
    $.ajax({
        type: "GET",
        url: "/assets/music/playlists/" + jsonPlayList,
        dataType: "json",
        contentType: "application/json; charset=utf-8",
        cache: false,
        success: function (data_Playlist) {
            var jList = $("#music-playlist ol");
            songList = [];
            $.each(data_Playlist.songs, function(i, song) {
                songList.push(song.file_name);
                jList.append('<li><a id="song_' + i + '" class="title" data-index=' + i + ' data-name="' + song.file_name + '" data-display="' + song.artist + ' - ' + song.title + '">' + song.title + '</a><br /><span class="artist">- ' + song.artist + '</span></li>');
            });
            $("#music-playlist a").click(function () {
                play($(this).attr("data-index"));
                $("#music-player").removeClass("hiding");
            });
        },
        error: function (xhr, status) {
            loadPlayList("default.json");
        }
    }).done(function () {
        // Just leave it here
    });
}
    
function play(songIndex) {
    if (songIndex < 0 || songIndex >= songList.length) {
        return;
    }
    currentSongIndex = songIndex;
    var fileName = songList[songIndex];
    $("#music-display").text($("#song_" + songIndex).attr("data-display"));
    domAudio.ontimeupdate = null;
    domAudio.src = "/assets/music/" + fileName + ".mp3";
    domAudio.load();
    $.ajax({
        type: "GET",
        url: "/assets/music/" + fileName + ".lrc",
        dataType: "text",
        cache: false,
        success: function (data_Lyrics) {
            lyrics = parseLyrics(data_Lyrics);
            lyricEffects = [];
            var currentLyricLine = -1;
            isEffectAvailable = false;
            prepareLyricShow(lyrics);
        },
        error: function (xhr, status) {
            jLyricPanel.empty();
            jLyricPanel[0].style.top = (domLyricShow.clientHeight / 2 - 60) + "px";
            jLyricPanel.append('<p class="active">No lyrics for this song :(</p>');
        }
    });
}

function prepareLyricShow(lyrics) {
    jLyricPanel.empty();
    for (var i = 0; i < lyrics.length; i++) {
        jLyricPanel.append('<p id="lyric-line-' + i + '">' + lyrics[i][1] + '</p>');
    }
    var lyricPanelOffset = 290;
    jLyricPanel[0].style.top = lyricPanelOffset + "px";
    domAudio.ontimeupdate = function (e) {
        for (var i = lyrics.length - 1; i >= 0; i--) {
            if (domAudio.currentTime >= lyrics[i][0]) {
                if (i != currentLyricLine) {
                    currentLyricLine = i;
                    $(jLyricPanel).find(".active").removeClass("active");
                    var jCurrentLine = $(jLyricPanel).find("#lyric-line-" + i);
                    jCurrentLine.addClass("active");
                    jLyricPanel.animate({ top: (lyricPanelOffset - jCurrentLine[0].offsetTop) + "px" });
                }
                break;
            }
        }
    }
}

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