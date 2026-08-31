(function () {
  var extra = [
    { id: "bZnnjK4bQuM", title: "今日練上身兩動作 09:00" },
    { id: "CcxLaHBQ904", title: "今日練上身兩動作 09:30" }
  ];
  function forceSkillSession() {
    var links = document.querySelectorAll('a[href*="session"]');
    for (var i = 0; i < links.length; i++) {
      var a = links[i];
      a.setAttribute("href", "/yipmma/session/?v=mc23");
    }
  }
  setTimeout(forceSkillSession, 200);
})();
