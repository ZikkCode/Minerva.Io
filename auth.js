function handleGoogleLogin(response) {
  const data = parseJwt(response.credential);
  document.getElementById("userInfo").innerHTML =
    "Logged in as: " + data.email;
}

function parseJwt(token) {
  return JSON.parse(atob(token.split(".")[1]));
}

window.onload = function () {
  google.accounts.id.initialize({
    client_id: "842170744505-l22qq4v46q4s2s2upcqqnahlbjtmkjai.apps.googleusercontent.com",
    callback: handleGoogleLogin
  });

  google.accounts.id.renderButton(
    document.getElementById("googleSignInDiv"),
    {
      theme: "filled_black",
      size: "large",
      shape: "pill"
    }
  );
};

<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <title>Minerva Login</title>

    <!-- Google Script -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>

    <style>
        body {
            font-family: Arial;
            background: #0f172a;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }

        .box {
            background: #1e293b;
            padding: 30px;
            border-radius: 12px;
            text-align: center;
        }

        #googleSignInDiv {
            margin-top: 20px;
        }
    </style>
</head>

<body>

    <div class="box">
        <h2>Minerva Login</h2>
        <div id="googleSignInDiv"></div>
        <p id="userInfo"></p>
    </div>

    <script>
        function handleGoogleLogin(response) {
            const data = parseJwt(response.credential);
            document.getElementById("userInfo").innerHTML =
                "Logged in as: " + data.email;
        }

        function parseJwt(token) {
            return JSON.parse(atob(token.split(".")[1]));
        }

        window.onload = function () {
            google.accounts.id.initialize({
                client_id: "842170744505-l22qq4v46q4s2s2upcqqnahlbjtmkjai.apps.googleusercontent.com",
                callback: handleGoogleLogin
            });

            google.accounts.id.renderButton(
                document.getElementById("googleSignInDiv"),
                {
                    theme: "filled_black",
                    size: "large",
                    shape: "pill"
                }
            );
        };
    </script>

</body>

</html>