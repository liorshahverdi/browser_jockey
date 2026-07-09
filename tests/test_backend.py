import unittest

from app import create_app


class TestConfig:
    TESTING = True
    SECRET_KEY = "test-secret"


class BackendTests(unittest.TestCase):
    def setUp(self):
        self.app = create_app(TestConfig)
        self.client = self.app.test_client()

    def test_configuration_object_is_loaded(self):
        self.assertTrue(self.app.config["TESTING"])
        self.assertEqual(self.app.config["SECRET_KEY"], "test-secret")

    def test_home_page(self):
        with self.client.get("/") as response:
            self.assertEqual(response.status_code, 200)
            self.assertIn(b"Browser Jockey", response.data)

    def test_browser_test_page(self):
        with self.client.get("/tests/unit-tests.html") as response:
            self.assertEqual(response.status_code, 200)

    def test_unknown_test_file_is_404(self):
        with self.client.get("/tests/does-not-exist.html") as response:
            self.assertEqual(response.status_code, 404)


if __name__ == "__main__":
    unittest.main()
