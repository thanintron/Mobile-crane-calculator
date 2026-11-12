import unittest
from fastapi.testclient import TestClient
from main import app, env

class AppTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)
        self.data = dict(boom_length_m=17, working_radius_m=8, net_load_ton=5)

    def test_shell_and_install_assets(self):
        for path in ['/', '/sw.js', '/static/app.js', '/static/style.css', '/static/manifest.webmanifest', '/static/icon-192.png', '/static/icon-512.png']:
            self.assertEqual(self.client.get(path).status_code, 200, path)
        manifest = self.client.get('/static/manifest.webmanifest').json()
        self.assertEqual(manifest['display'], 'standalone')

    def test_models_mark_chart_as_example(self):
        self.assertEqual(self.client.get('/api/v1/crane/models').json()[0]['source_status'], 'unverified_example')

    def test_calculation(self):
        r = self.client.post('/api/v1/crane/calculate', json=self.data)
        self.assertEqual(r.status_code, 200)
        data = r.json()
        self.assertEqual(data['total_gross_load_ton'], 5.8)
        self.assertEqual(data['rated_capacity_ton'], 15)
        self.assertEqual(data['utilization_rate_pct'], 38.67)
        self.assertIn('NOT APPROVED', data['review_status'])
        self.assertEqual(len(data['limitations']), 5)

    def test_invalid_and_out_of_chart_inputs(self):
        for change in [dict(net_load_ton=-1), dict(working_radius_m=17), dict(working_radius_m=1), dict(boom_length_m=5), dict(boom_length_m=50), dict(crane_model='unknown'), dict(ground_bearing_capacity_ton_m2=0)]:
            with self.subTest(change=change):
                self.assertIn(self.client.post('/api/v1/crane/calculate', json={**self.data, **change}).status_code, [400, 422])

    def test_template_escapes_names(self):
        rendered=env.get_template('lifting_plan_template.html').render(plan_id='test', data={'planner_name':'<script>alert(1)</script>', 'limitations':['example']})
        self.assertNotIn('<script>', rendered)
        self.assertIn('&lt;script&gt;', rendered)
        self.assertIn('ยังไม่อนุมัติงานยก', rendered)

if __name__ == '__main__':
    unittest.main()
