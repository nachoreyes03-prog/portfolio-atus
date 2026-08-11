param(
  [string]$Root = $PSScriptRoot,
  [int]$Port = 8747
)
$ErrorActionPreference = "Stop"

# Server estatico MULTIHILO (C# embebido): atiende requests en paralelo.
# El anterior era secuencial y con varios videos cargando se trababa todo.
Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Net;
using System.Threading.Tasks;
using System.Collections.Generic;

public static class AtusServer
{
    static readonly Dictionary<string,string> Mime = new Dictionary<string,string>(StringComparer.OrdinalIgnoreCase){
        {".html","text/html; charset=utf-8"},
        {".css","text/css; charset=utf-8"},
        {".js","application/javascript; charset=utf-8"},
        {".svg","image/svg+xml"},
        {".png","image/png"},
        {".jpg","image/jpeg"},
        {".jpeg","image/jpeg"},
        {".gif","image/gif"},
        {".webp","image/webp"},
        {".ico","image/x-icon"},
        {".json","application/json"},
        {".pdf","application/pdf"},
        {".mp4","video/mp4"},
        {".webm","video/webm"},
        {".mp3","audio/mpeg"},
        {".woff2","font/woff2"}
    };

    public static void Run(string root, int port)
    {
        var listener = new HttpListener();
        listener.Prefixes.Add("http://localhost:" + port + "/");
        listener.Start();
        Console.WriteLine("Serving " + root + " at http://localhost:" + port + "/ (multihilo)");
        while (true)
        {
            HttpListenerContext ctx;
            try { ctx = listener.GetContext(); }
            catch { break; }
            Task.Run(() => Handle(ctx, root));
        }
    }

    static void Handle(HttpListenerContext ctx, string root)
    {
        try
        {
            var req = ctx.Request;
            var res = ctx.Response;
            string path = Uri.UnescapeDataString(req.Url.AbsolutePath);
            if (path.EndsWith("/")) path += "index.html";
            string full = Path.GetFullPath(Path.Combine(root, path.TrimStart('/').Replace('/','\\')));
            if (!full.StartsWith(root, StringComparison.OrdinalIgnoreCase) || !File.Exists(full))
            {
                res.StatusCode = 404;
                var nb = System.Text.Encoding.UTF8.GetBytes("404 Not Found");
                res.ContentLength64 = nb.Length;
                res.OutputStream.Write(nb, 0, nb.Length);
                res.OutputStream.Close();
                return;
            }
            string mime;
            res.ContentType = Mime.TryGetValue(Path.GetExtension(full), out mime) ? mime : "application/octet-stream";
            long len = new FileInfo(full).Length;
            res.Headers.Add("Accept-Ranges", "bytes");
            if (req.HttpMethod == "HEAD")
            {
                res.ContentLength64 = len;
                res.OutputStream.Close();
                return;
            }
            long start = 0, end = len - 1;
            string range = req.Headers["Range"];
            if (!string.IsNullOrEmpty(range) && range.StartsWith("bytes="))
            {
                var parts = range.Substring(6).Split('-');
                long s, e;
                if (long.TryParse(parts[0], out s)) start = s;
                if (parts.Length > 1 && long.TryParse(parts[1], out e)) end = e;
                if (end >= len) end = len - 1;
                if (start > end) start = end;
                res.StatusCode = 206;
                res.Headers.Add("Content-Range", "bytes " + start + "-" + end + "/" + len);
            }
            long count = end - start + 1;
            res.ContentLength64 = count;
            using (var fs = File.OpenRead(full))
            {
                fs.Seek(start, SeekOrigin.Begin);
                var buf = new byte[81920];
                long rem = count;
                while (rem > 0)
                {
                    int read = fs.Read(buf, 0, (int)Math.Min(buf.Length, rem));
                    if (read <= 0) break;
                    res.OutputStream.Write(buf, 0, read);
                    rem -= read;
                }
            }
            res.OutputStream.Close();
        }
        catch
        {
            try { ctx.Response.Abort(); } catch {}
        }
    }
}
"@

[AtusServer]::Run((Resolve-Path $Root).Path, $Port)

