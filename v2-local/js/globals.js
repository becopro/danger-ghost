
		// Secure HTML Escaping function to shield against stored XSS attacks
		function escapeHTML(str) {
			if (!str) return "";
			return str.toString()
				.replace(/&/g, "&amp;")
				.replace(/</g, "&lt;")
				.replace(/>/g, "&gt;")
				.replace(/"/g, "&quot;")
				.replace(/'/g, "&#039;");
		}
		window.escapeHTML = escapeHTML;

		function SafeBtoa(str) {
			try {
				return btoa(unescape(encodeURIComponent(str)));
			} catch (err) {
				console.error("SafeBtoa failed:", err);
				return btoa(str);
			}
		}
		function SafeAtob(str) {
			try {
				var raw = atob(str);
				try {
					return decodeURIComponent(escape(raw));
				} catch (e) {
					return raw;
				}
			} catch (err) {
				console.error("SafeAtob failed:", err);
				return atob(str);
			}
		}
		window.SafeBtoa = SafeBtoa;
		window.SafeAtob = SafeAtob;

		
