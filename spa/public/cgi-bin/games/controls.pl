<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Stadium Scoreboard Controls</title>
  <style>
    body {
      background-color: #0c0f12;
      color: #00ffcc;
      font-family: 'Courier New', Courier, monospace;
      text-align: center;
      padding: 30px;
      margin: 0;
    }
    h3 {
      color: #ff0077;
      text-shadow: 0 0 10px #ff0077;
      margin-bottom: 25px;
      font-size: 18px;
    }
    .btn-control {
      display: inline-block;
      width: 140px;
      padding: 12px 10px;
      margin: 10px;
      font-weight: bold;
      font-size: 14px;
      color: #000;
      background-color: #00ffcc;
      border: 2px solid #00aa88;
      border-radius: 6px;
      cursor: pointer;
      box-shadow: 0 0 8px #00ffcc;
      transition: all 0.2s ease-in-out;
    }
    .btn-control:hover {
      background-color: #fff;
      color: #00ffcc;
      box-shadow: 0 0 15px #fff;
      transform: scale(1.05);
    }
    .btn-boo {
      background-color: #ff0077;
      border-color: #aa0055;
      box-shadow: 0 0 8px #ff0077;
    }
    .btn-boo:hover {
      background-color: #fff;
      color: #ff0077;
      box-shadow: 0 0 15px #fff;
    }
  </style>
  <script>
    function triggerSound(eventName) {
      try {
        if (window.opener && !window.opener.closed) {
          const X3D = window.opener.X3D;
          if (X3D) {
            const browser = X3D.getBrowser();
            const scene = browser.currentScene;
            const node = scene.getNamedNode(eventName);
            if (node) {
              node.set_time = browser.getCurrentTime();
              console.log("Triggered sound event: " + eventName);
            } else {
              console.error("SharedEvent node not found: " + eventName);
            }
          } else {
            console.error("X3D browser not found in parent window opener.");
          }
        } else {
          console.error("Parent window opener is closed.");
        }
      } catch (e) {
        console.error(e);
      }
    }
  </script>
</head>
<body>
  <h3>STADIUM SOUNDBOARD CONTROLS</h3>
  <button class="btn-control btn-cheer" onclick="triggerSound('BGapplause')">APPLAUSE</button>
  <button class="btn-control btn-boo" onclick="triggerSound('BGboo')">BOO</button>
</body>
</html>
