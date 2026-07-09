import re
import subprocess
import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


class StaticSiteTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        subprocess.run([sys.executable, str(ROOT / "scripts" / "build_static.py")], check=True)
        cls.dist = ROOT / "dist"
        cls.html = (cls.dist / "index.html").read_text()

    def test_artifact_contains_no_flask_template_syntax(self):
        self.assertNotIn("{{", self.html)
        self.assertNotIn("url_for(", self.html)

    def test_local_html_assets_exist(self):
        refs = re.findall(r'(?:src|href)=["\']([^"\']+)', self.html)
        local_refs = [ref.split("?", 1)[0] for ref in refs if not re.match(r"^(?:https?:|data:|#)", ref)]
        for ref in local_refs:
            with self.subTest(ref=ref):
                self.assertTrue((self.dist / ref).is_file(), f"Missing built asset: {ref}")

    def test_javascript_has_no_origin_absolute_static_paths(self):
        for path in (self.dist / "app" / "static" / "js").rglob("*.js"):
            source = path.read_text()
            with self.subTest(path=path.relative_to(self.dist)):
                self.assertNotRegex(source, r"['\"]/static/", "Breaks GitHub Pages project subpaths")

    def test_pages_artifact_excludes_backend_and_docs(self):
        self.assertFalse((self.dist / "app" / "__init__.py").exists())
        self.assertFalse((self.dist / "README.md").exists())
        self.assertFalse((self.dist / "docs").exists())


if __name__ == "__main__":
    unittest.main()
