Поведение никогда не будет соответсвовать корпусу на 100%, т.к.

* библиотека должна оставаться компактной,
* библиотека не предназначена для имён собственных,
хоть и может с горем пополам их обрабатывать,
* корпус сам по себе может содержать нерегулярности.

*Основные тесты не могут быть включены в основную ветку* из-за лицензии корпуса.
Вместо них, тут есть простые тесты, где проверяется в основном API
и некоторые конкретные случаи (например, упоминающиеся в README).

*Простота поддержки важнее компактности кода.*

--------------

Алгоритм внесения изменений:

1. форкаем репозиторий
2. клонируем на локальную машину
3. переходим в ветку `gh-pages`
4. запускаем `ruby serve-with-ruby.rb`
5. проверяются текущие результаты по адресу `http://localhost:9090/testing.html`
6. правка вносится в файл `js/RussianNouns.js` (нужно добавить свой копирайт, если его еще нет)
7. запускается `check.sh` (он должен отработать без ошибок) — будет сгенерирован `js/RussianNouns.min.js`
8. проверяются новые результаты по адресу `http://localhost:9090/testing.html`
9. если результаты стали сильно лучше, пушим в `gh-pages` своего репозитория; иначе возвращаемся к шагу 6
10. делаем пулл реквест из своего `gh-pages` в мой `gh-pages`
11. копируем на локальной машине `js/RussianNouns.js` и `js/RussianNouns.min.js` в какую-то другую папку
12. переключаемся в основную ветку
13. перезаписываем `RussianNouns.js` и `RussianNouns.min.js` своей новой версией
14. `npm test` должен отработать без ошибок; иначе выясняем в чем проблема,
и если это не связано с устареванием API в тесте,
переходим снова в `gh-pages` и возвращаемся к шагу 6
15. коммитим, пушим, делаем пулл-реквест (по названию должно быть понятно, что два пулл-реквеста связаны)

--------------

Если кто-то хочет портировать на C++, заготовка есть в ветке gh-pages.
Лучше форкнуть.