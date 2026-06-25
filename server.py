"""
Correct range-request HTTP server for local development.
Overrides do_GET to serve byte ranges properly (HTTP 206).
"""
import http.server
import os
import sys
import mimetypes


class RangeHTTPHandler(http.server.BaseHTTPRequestHandler):

    def do_GET(self):
        self._serve(head_only=False)

    def do_HEAD(self):
        self._serve(head_only=True)

    def _serve(self, head_only=False):
        # Translate URL path to filesystem path
        path = self.translate_path(self.path)

        # Directory: fall back to index.html or directory listing
        if os.path.isdir(path):
            for index in ('index.html', 'index.htm'):
                candidate = os.path.join(path, index)
                if os.path.exists(candidate):
                    path = candidate
                    break
            else:
                self.send_error(403, "Directory listing not allowed")
                return

        if not os.path.isfile(path):
            self.send_error(404, "File not found")
            return

        ctype = mimetypes.guess_type(path)[0] or 'application/octet-stream'
        file_size = os.path.getsize(path)

        range_header = self.headers.get('Range')

        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(403, "Cannot open file")
            return

        try:
            if range_header and range_header.startswith('bytes='):
                # Parse byte range
                ranges = range_header[6:].split(',')[0].strip()
                start_str, end_str = ranges.split('-')
                start = int(start_str) if start_str else 0
                end   = int(end_str)   if end_str   else file_size - 1
                end   = min(end, file_size - 1)

                if start > end or start >= file_size:
                    self.send_response(416)  # Range Not Satisfiable
                    self.send_header('Content-Range', f'bytes */{file_size}')
                    self.end_headers()
                    return

                length = end - start + 1
                self.send_response(206)
                self.send_header('Content-Type', ctype)
                self.send_header('Content-Length', str(length))
                self.send_header('Content-Range', f'bytes {start}-{end}/{file_size}')
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()

                if not head_only:
                    f.seek(start)
                    remaining = length
                    buf_size = 64 * 1024  # 64 KB chunks
                    while remaining > 0:
                        chunk = f.read(min(buf_size, remaining))
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        remaining -= len(chunk)
            else:
                # Full file
                self.send_response(200)
                self.send_header('Content-Type', ctype)
                self.send_header('Content-Length', str(file_size))
                self.send_header('Accept-Ranges', 'bytes')
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()

                if not head_only:
                    buf_size = 64 * 1024
                    while True:
                        chunk = f.read(buf_size)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
        except (BrokenPipeError, ConnectionResetError, ConnectionAbortedError):
            pass  # Client disconnected — normal for video seeking
        finally:
            f.close()

    def translate_path(self, path):
        """Map URL path to local filesystem path."""
        import urllib.parse
        path = urllib.parse.unquote(path.split('?')[0].split('#')[0])
        path = path.lstrip('/')
        return os.path.join(os.getcwd(), os.path.normpath(path))

    def log_message(self, fmt, *args):
        # Only log non-routine requests
        code = args[1] if len(args) > 1 else ''
        if code not in ('200', '206', '304'):
            super().log_message(fmt, *args)


PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080
print(f"Serving at  http://localhost:{PORT}  (range-request enabled)")
print("Press Ctrl+C to stop.\n")

with http.server.ThreadingHTTPServer(('', PORT), RangeHTTPHandler) as httpd:
    httpd.serve_forever()
