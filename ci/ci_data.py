"""Вымышленные данные для автотестов: 3 игрока, история с начала сезона до вчера, квесты на сегодня."""
import random, datetime
def make(seed=7):
    random.seed(seed)
    TZ = 5 * 3600 * 1000
    now = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=5)
    TODAY = now.strftime('%Y-%m-%d')
    def ms(day, h, m=0):
        d = datetime.datetime.strptime(day, '%Y-%m-%d').replace(tzinfo=datetime.timezone.utc)
        return int(d.timestamp() * 1000) - TZ + (h * 3600 + m * 60) * 1000
    start = datetime.date(2026, 10, 15); d = start; days = []
    while d.isoformat() < TODAY: days.append(d.isoformat()); d += datetime.timedelta(days=1)
    days = days[-60:]
    U = {'aitbatyr': 'u_me', 'aldiyar': 'u_arman', 'nursultan': 'u_dana'}
    docs = {'roster/main': U, 'roster/meta': {'players': [{'id': 'aldiyar', 'name': 'Арман', 'joined': '2026-10-15'}, {'id': 'nursultan', 'name': 'Дана', 'joined': '2026-10-15'}]}}
    POOL = [("Тренировка в зале", "str", "C"), ("Час английского", "int", "C"), ("Прочитать 20 страниц", "int", "D"), ("Лечь до 23:30", "wil", "E"),
            ("Написать бит", "cre", "C"), ("Позвонить родителям", "cha", "E"), ("Подработка", "fin", "C"), ("Очень длинное название квеста чтобы проверить перенос строк на узком экране", "int", "D")]
    n = [0]
    def tid():
        n[0] += 1; return 't%05d' % n[0]
    for slot, uid in U.items():
        for day in days:
            for (t, st, rk) in random.sample(POOL, random.randint(3, 5)):
                done = random.random() < 0.65
                q = {'m': {'E': 15, 'D': 30, 'C': 60}[rk], 'e': random.randint(0, 2), 'l': random.randint(0, 2)} if day >= '2026-11-14' else {'rank': rk}
                docs[f'q/{uid}/tasks/{tid()}'] = {'title': t, 'stat': st, **q, 'date': day, 'done': done, 'createdAt': ms(day, 8), **({'doneAt': ms(day, random.randint(10, 22))} if done else {})}
        docs[f'q/{uid}/meta/prefs'] = {'tourDone': True, 'seenVer': 99, 'lastSeen': ms(days[-1], 22) if slot == 'aldiyar' else ms(TODAY, 0, 5) if days else 0}
    # сегодня: первая привычка (её можно отметить в любое время), две задачи нового вида и два старых квеста с буквой
    TODAYQ = [{'m': 0, 'e': 1, 'l': 1}, {'m': 30, 'e': 1, 'l': 0}, {'m': 60, 'e': 2, 'l': 2}, {'rank': 'D'}, {'rank': 'C'}]
    for i, ((t, st, rk), q) in enumerate(zip(POOL[:5], TODAYQ)):
        docs[f'q/u_me/tasks/{tid()}'] = {'title': t, 'stat': st, **q, 'date': TODAY, 'done': False, 'createdAt': ms(TODAY, 0, 1 + i)}
    accs = [{'auth_id': 'a-me', 'uid': 'u_me', 'email': 'ci@sistema.local', 'admin': True, 'created_at': '2026-10-15T00:00:00Z'}]
    return {'docs': docs, 'accounts': accs, 'session': {'user': {'id': 'a-me', 'email': 'ci@sistema.local'}}}
