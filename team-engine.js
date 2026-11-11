/* Discrete-event training-dummy simulation. No team tier lists. */
(function(root){
  const G=root.HSR_EQUIPMENT;
  const models={
    '1415':{role:'support',notes:'Кирена E0: Воспоминания, Будущее, зона истинного урона, первая активация ульт команды, Демиург SPD 0 и оды. Политика Демиурга: сначала ода основному кору, затем неполученные оды союзников; иначе атака. Подробные границы — FINAL_ROSTER.md.'},
    '1505':{role:'dps',notes:'Эванесса E0: энергия ↔ Настоящий хит без рекурсивного удвоения, Учитель Лиса за 240 накопленной энергии, дополнительные отскоки ульты, Радость от CD, перенос Хита предыдущих участников и истёкших порций.'},
    '1506':{role:'dps',notes:'Серебряный Волк ур. 999 E0: Скрытые очки вместо энергии, Непобедимый игрок на три усиленные базовые, 100 отскоков, коробочки и усиленный навык Радости. Выбор подарка коробочки — параметр сценария; скрытые вероятности не выдумываются.'},
    '1510':{role:'dps',notes:'Химеко: Нова E0: общий заряд поддержки, Звездопроходец, два протокола, 6 лучей и импульсы ульты. Политика поддержки: компаньоны Освоения используют её перед своим обычным действием, прочие союзники — только по явной настройке. Политика не перебирается.'},
    '1512':{role:'support',notes:'Зарянка: Яснопея E0: Музыканты ясного неба, Настроение, Раж с отдельным отсчётом SPD 140, HP-урон, бафы от полученного Настроения и Особый гость. Игнорирование DEF не даёт выигрыша при DEF 0.'},
    '1513':{role:'dps',notes:'Авантюрин: Прибой E0: Пыл, Юмор от атак команды, внеочередной навык Радости и усиление следующего Мига Ахи. В одиночку на Пути Радости навыки Радости считаются бонус-атаками; длительность Хита 3 хода.'},
    '1413':{role:'dps',notes:'Темень E0: Тьмуша SPD 160, отдельный HP, Мемория от потери HP и действий духов, усиленное исчезновение, Загадка тьмы и крит. урон духов. Без входящих атак заряд набирается только от собственных расходов HP и действий команды.'},
    '8007':{role:'support',notes:'Первопроходец Памяти E0: Мемо SPD 130, заряд от энергии команды, продвижение и истинный урон основного кора, Эпос и совместная базовая. Поддержка владельца не переносится на духа: это эффект E1.'},
    '1501':{role:'dps',notes:'Искра E0: стрим до 20 расходов SP, подарки по seed, Взрыв вместо SP, Юмор, ход Ахи и отдельный урон Радости. Авто расходует доступные SP/Взрыв до лимита. Шанс подарка задаётся в условиях боя (по умолчанию 20%, предположение: распределения в снимке нет).'},
    '1502':{role:'support',notes:'Яо Гуан E0: Радость от SPD, зона, Юмор, дополнительный ход Ахи за 20 Юмора, RES PEN и Великая удача после атак. Настоящий хит хранит независимые длительности.'},
    '1503':{role:'sustain',notes:'Жемчуг E0: DEF-атаки и лечение, бессрочный Настоящий хит, Глубокое обучение кора, продвижение и усиленные базовые. Болванки не атакуют: поглощение урона не расходуется. В команде из четырёх Радостей дополнительный ход приближён продвижением 100%.'},
    '8009':{role:'support',notes:'Первопроходец Радости E0: Юмор после атак, Настоящий хит, командное восстановление энергии, продвижение кора или немедленный навык Радости. Дополнительный урон навыка учитывает максимальный Настоящий хит команды.'},
    '1504':{role:'dps',notes:'Эшвейл E0: Приманка, три заряда, бонус-атаки после атак союзников, Прожорливость и усиленная бонус-атака ульты. Нет добиваний и переходов на новую Приманку при бесконечном HP.'},
    '1507':{role:'dps',notes:'Мортенакс Блэйд E0: HP-урон, Безмерная ярость с отсчётом SPD 70, бесплатный навык, бонус-атака за 9 атак и энергия с переполнением 80. Без входящих атак нет зарядов за полученные удары.'},
    '1508':{role:'dps',notes:'Рин Тосака E0: энергия камней от расходов/возвратов SP, усиленный навык с расходом лишних SP до остатка 2, командный CD, совместная бонус-атака с Арчером и лимит SP +2. Камни считаются отдельно от энергии ульты.'},
    '1509':{role:'dps',notes:'Гильгамеш E0: Энтузиазм от действий союзников, скорость, энергия от ульт команды, постоянный режим навыков после 10 зарядов, совместная бонус-атака с Сэйбер. DEF ignore не усиливает урон при DEF 0.'},
    '1402':{role:'dps',notes:'Аглая E0: Швея с отдельными HP, ходами и SPD, Связующая нить, Высшая форма с отсчётом SPD 100, совместная базовая и ATK от скорости. Умения духа ур. 6. Адресные бафы не наследуются автоматически.'},
    '1407':{role:'dps',notes:'Кастория E0: Новое цветение от потери HP и лечения, включая избыточное с лимитом на действие, бесплатные навыки, Крылья Смерти SPD 165 и полный цикл дыханий с завершением. Техники и воскрешение без входящего урона не срабатывают.'},
    '1409':{role:'sustain',notes:'Гиацина E0: Ика с HP и SPD 0, накопление исходящего лечения, пассивное лечение после потери HP, дополнительная атака после действий Гиацины в После дождя, командный HP и след SPD >200. Избыточное лечение входит в накопление.'},
    '1408':{role:'dps',notes:'Фаенон E0: Ядро пламени, Каослана с 8 специальными действиями и уходом союзников, Бедствие, усиленные атаки и завершающий удар. Авто чередует набор Бедствия базовыми и расход 4 усиленным навыком; контратакующий навык не выбирается без входящих атак.'},
    '8001':{role:'dps',notes:'Первопроходец Разрушения E0, мужская форма: взрывной навык, выбор одиночной/взрывной ульты по числу целей, ATK и DEF за собственные пробития, начальная энергия. Другие Пути Первопроходца не могут быть в этой же команде.'},
    '8003':{role:'sustain',notes:'Первопроходец Сохранения E0, мужская форма: Воля магмы, усиленная базовая, DEF-ульт, малые щиты после действий и энергия от щита. Без атак болванок нет зарядов за входящие попадания. Один Путь Первопроходца на команду.'},
    '1001':{role:'sustain',notes:'Март 7 Сохранения: DEF-щит, массовая Заморозка и контратаки при тренировочных атаках по союзнику под щитом. Нельзя одновременно с Март Охоты.'},
    '1008':{role:'dps',notes:'Арлан E0: навык без SP за 15% максимального HP, рост урона от потерянного HP и взрывная ульта. HP не опускается ниже 1; лечение после убийств и защита от входящего урона здесь не активируются.'},
    '1110':{role:'sustain',notes:'Рысь E0: HP-базовая, Реакция выживания с прибавкой HP, лечение навыком/ультой и периодическое лечение на 3 хода с добавкой по цели навыка. Без атак противников нет энергии от получения удара.'},
    '1312':{role:'dps',notes:'Миша E0: количество ударов ульты от SP команды, энергия таланта, навык и отскакивающая ульта до 10 ударов с Заморозкой, EHR и крит. уроном по замороженным целям.'},
    '1014':{role:'dps',notes:'Сэйбер E0: Резонанс ядра, энергия до 480, Вспышка маны, навык с конвертацией зарядов, ульта с 10 отскоками и обязательная усиленная базовая. Техники отключены.'},
    '1015':{role:'dps',notes:'Арчер E0: навык за 2 SP до пяти раз в ход, рост урона цепи, лимит SP +2, заряды ульты и бонус-атака с возвратом SP. Авто использует максимально доступную цепь, без перебора ротаций.'},
    '1404':{role:'dps',notes:'Мидей E0: HP-масштабирование, заряд от фактической потери HP, Кровная месть, бесплатный автоматический навык и дополнительный ход за 150 заряда. Без атак противников заряд зависит от расхода HP и лечения команды.'},
    '1412':{role:'support',notes:'Керидра E0: Боевые заслуги, заряд, Воинский титул, копия атакующего навыка перед оригиналом, ATK, SPD, CD навыка и RES PEN. Копия не тратит SP/HP/особые ресурсы и не даёт базовую энергию умения; некоторые атаки сохраняют пакетное приближение.'},
    '1414':{role:'sustain',notes:'Дань Хэн: Освободитель Пустошей E0: Соратник — адресат бафов, суммируемый щит до 300%, ATK Соратника, Душа дракона SPD 165 с продвижением, два усиленных действия и урон элемента Соратника. Не дух памяти.'},
    '1201':{role:'dps',notes:'Цинцюэ E0: случайные кости трёх мастей, добор за SP без конца хода, Закрытый конг, усиленная базовая без SP и четыре одинаковые кости ульты. Seed определяет добор; E4 и E6 не включены.'},
    '1207':{role:'support',notes:'Юйкун E0: две Ревущие тетивы с расходом на ходах союзников, ATK, криты ульты, командный мнимый бонус и усиленная базовая через ход. Расстановка скорости влияет на получателей бафов.'},
    '1215':{role:'support',notes:'Ханья E0: Ноша на первой цели, один возврат SP за две подходящие атаки, два возврата на наложение, DMG и ATK следа, адресные ATK/SPD ульты. Ноша не считается ослаблением.'},
    '1223':{role:'dps',notes:'Моцзэ E0: Жертва, Отсутствие со снятием собственной шкалы, девять зарядов, дополнительный урон и FUA раз за три расхода, возврат SP с перезарядкой, ульта как FUA. Соло не использует навык.'},
    '1224':{role:'dps',notes:'Март 7 Охоты E0: Учитель — адресат бафов, заряды от его атак/ульт, усиленная базовая с seed-проками, эффекты Пути Учителя, криты и BE после усиленной базовой. E2/E6 не включены.'},
    '1310':{role:'dps',notes:'Светлячок, исходный кит: Полное сгорание с отсчётом SPD 70, усиленные атаки, эффективность, ATK → BE и собственное суперпробитие. Техника не моделируется.'},
    '1315':{role:'dps',notes:'Бутхилл E0: Дуэль без завершения хода, Карманное преимущество от пробитий, усиленная базовая и повторный физический брейк. Начинает без сохранённых зарядов; основная цель — первая болванка.'},
    '1317':{role:'dps',notes:'Раппа E0: три усиленные базовые, эффективность, заряды от пробитий, дополнительный брейк и суперпробитие. Болванки считаются обычными: без дополнительного заряда/энергии за элитных врагов.'},
    '1321':{role:'support',notes:'Георгина E0: зона эффективности и суперпробития до слома, партнёр — первый кор, пятиударная FUA, SP и BE от лечения/щитов. Все цели уже имеют уязвимости; добавление уязвимости всё равно активирует её след.'},
    '8005':{role:'support',notes:'Первопроходец Гармонии E0: пять попаданий навыка, усиленное первое истощение, командный BE, суперпробитие от числа целей, энергия и задержка при сломе. Мужская форма; E4/E6 не включены.'},
    '1301':{role:'sustain',notes:'Галлахер E0: Мертвецки пьян с уязвимостью к пробитию, продвижение ультой, усиленная базовая и лечение от BE. Входящего урона у болванок нет.'},
    '1214':{role:'dps',notes:'Сюэи E0: BE → бонус урона, Карма от фактически истощённой стойкости, перенос избытка и трёхударная FUA. Ульта учитывает истощение стойкости.'},
    '1111':{role:'dps',notes:'Лука E0: Воля к битве, усиленная базовая с дополнительными ударами, Кровотечение и его подрыв, включая кровотечение пробития. При бесконечном HP обычное Кровотечение ограничено ATK.'},
    '1206':{role:'dps',notes:'Сушан E0: Стойка меча, гарантированная по пробитой цели, усиление ультой, скорость и продвижение при сломе. Возврат SP E1 не включён.'},
    '1108':{role:'dps',notes:'Сампо E0: пять отскоков навыка, Выветривание до 5, AoE-ульт и уязвимость к DoT, включая периодический урон пробития. Подрыв E4 не включён.'},
    '1221':{role:'dps',notes:'Юньли E0: навык с лечением, ульта за 120 энергии, Блок до следующего хода и чередование Вырубки/Истребления по следу. Тренировочные попадания включают обычные контратаки, энергию таланта и Истребление во время Блока.'},
    '1222':{role:'sustain',notes:'Линша E0: Фуюань SPD 90 с запасом действий, продвижение навыком/ультой, лечение, ATK и исцеление от BE, экстренная бонус-атака от потери HP. Стойкость, эффективность и уязвимость к пробитию участвуют в расчёте.'},
    '1225':{role:'support',notes:'Фуга E0: Молитва лисы, усиленная базовая, возврат первого SP, ослабление DEF. Экзостойкость 40%, суперпробитие 100%, задержка и командный BE при сломе.'},
    '1307':{role:'dps',notes:'Чёрный Лебедь E0: Аркан до 50, соседний DoT при 3 уровнях, сброс/сохранение Прозрением, EHR в урон, стаки от собственных атак и DoT союзников. Игнорирование DEF не даёт выигрыша при DEF 0.'},
    '1308':{role:'dps',notes:'Ахерон E0: отдельный ресурс с началом 5, 1 заряд за умение с ослаблением, переполнение до 3, Багровые узлы, три Клинка дождя, завершение и шесть ударов следа. Энергия и ERR не восстанавливают её ресурс.'},
    '1401':{role:'dps',notes:'Великая Герта E0: Интерпретация, Ответ, энергия от атак, повторяющийся навык, Вдохновение и усиленный навык, немедленный ход после ульты и бонусы двух Эрудиций. Основная болванка получает приоритет перераспределения.'},
    '1403':{role:'support',notes:'Трибби E0: командный RES PEN, зона получаемого урона, дополнительный HP-урон за поражённые цели, FUA после ульт союзников, энергия от их атак и HP от команды. Герцог 4 исключён до проверки попаданий.'},
    '1405':{role:'dps',notes:'Анакса E0: пять попаданий с приоритетом разных целей, бесплатный дополнительный навык, бонус количества Эрудиций. У болванок все семь уязвимостей: Проявление качеств активно постоянно, новые уязвимости не добавляются.'},
    '1406':{role:'dps',notes:'Цифер E0: постоянная уязвимость, ATK навыка, FUA раз за собственный ход, запись фактически нанесённого неистинного урона, пороги SPD и истинный урон ульты без повторных множителей. Герцог 4 исключён.'},
    '1410':{role:'dps',notes:'Гисиленса E0: четыре разных DoT, стартовая зона и SP, уязвимость навыка, дополнительные DoT зоны с лимитом 8 на цель за ход/атаку, подрыв ультой и урон от EHR. Кровотечение ограничено ATK при бесконечном HP цели.'},
    '1006':{role:'support',notes:'Серебряный Волк E0: навык с понижением RES, ульта DEF, случайные Баги и их длительности. У болванок все уязвимости: имплант не добавляет отдельное понижение RES, DEF-эффекты не усиливают урон при DEF 0.'},
    '1107':{role:'dps',notes:'Клара E0: базовая, AoE-навык, ульта и заряды усиленной контратаки. Тренировочные попадания включают метки Сварога, обычные и усиленные контратаки.'},
    '1112':{role:'dps',notes:'Топаз E0: Справка о задолженности, базовая и навык как бонус-атаки, Счетовод с SPD 80, продвижение от бонус-атак и два усиленных действия после ульты. Четыре предмета Герцога исключены: распределение попаданий Счетовода не подтверждено.'},
    '1209':{role:'dps',notes:'Яньцин E0: Эмпатическая связь, криты ульты, вероятностная бонус-атака и Заморозка, дополнительный ледяной урон и скорость следа. Расход HP союзником не снимает связь. Герцог 4 исключён до проверки распределения попаданий бонус-атаки.'},
    '1213':{role:'dps',notes:'Пожиратель Луны E0: четыре уровня базовой, отдельные удары, Праведное сердце, Громкий рёв, Чешуя дракона вместо SP. Авто выбирает максимальное доступное усиление; политика базовых отключает усиление. Перебор ротаций не выполняется.'},
    '1217':{role:'sustain',notes:'Хохо E0: лечение навыка и таланта, энергия от лечения, командные энергия и ATK ульты. Авто поддерживает талант. Без входящих ослаблений очищение не требуется; энергия Фэйсяо особая и не восстанавливается ультой.'},
    '1218':{role:'dps',notes:'Цзяоцю E0: Жаркий пепел до 5 уровней, Горение, уязвимость и зона урона ульт с шестью активациями на ходах противников, ATK от EHR, начальная энергия. Эйдолоны не используются.'},
    '1304':{role:'sustain',notes:'Авантюрин E0: базовая и урон от DEF, начальные и суммируемые щиты, КШ от DEF, Паника, случайные заряды ульты, заряды от бонус-атак союзников и семиударная бонус-атака. Болванки не дают заряды входящими атаками.'},
    '1313':{role:'support',notes:'Воскресенье E0: продвижение кора и поддержанных призывов/духов, урон и КШ навыка, Блаженный с CD и энергией не менее 40, возврат SP и начальная энергия. Гармония не продвигается навыком.'},
    '1314':{role:'dps',notes:'Яшма E0: взрывная базовая, Сборщик долгов с SPD и расходом HP, дополнительный урон от ATK Яшмы, заряды за поражённые цели, бонус-атаки, Залог до 50 и усиление двух бонус-атак ультой. Герцог 4 исключён до проверки распределения попаданий.'},
    '1004':{role:'dps',notes:'Исходный Вельт E0: три попадания навыка, Замедление, Заключение, задержка действия, уязвимость ульты, энергия и дополнительный урон таланта. Усиленный кит не используется.'},
    '1302':{role:'dps',notes:'Аргенти E0: AoE, энергия за каждую поражённую цель, Апофеоз и шесть отскоков полной ульты. Авто ждёт 180 энергии; убийств и низкого HP у болванок нет.'},
    '1212':{role:'dps',notes:'Исходная Цзинлю E0: Сизигия, трансмиграция с продвижением и крит. шансом, бесплатный усиленный навык, расход HP союзников и временная ATK от поглощённого HP. Усиленный HP-кит не используется.'},
    '1303':{role:'support',notes:'Жуань Мэй E0: скорость союзников, урон навыка с масштабированием от эффекта пробития, зона RES PEN, энергия следа. Эффективность 50%, брейк таланта и задержка восстановления Цветением; BE задаётся в статах.'},
    '1309':{role:'support',notes:'Зарянка E0: бафы команды, начальное продвижение, Концерт с отдельным отсчётом SPD 90 и продвижением союзников, энергия за атаки и дополнительный физический урон с фиксированными критами.'},
    '1306':{role:'support',notes:'Исходная Искорка E0: лимит SP 7, восстановление 4 SP, три уровня таланта, Шифр, крит. урон и продвижение кора на 50%, квантовый след. Усиленный кит не используется.'},
    '1203':{role:'sustain',notes:'Лоча E0: лечение от ATK, автоматический навык без SP с перезарядкой, Цветок Бездны, поле лечения атакующего и остальных союзников, AoE-ульт. У болванок нет усилений для снятия.'},
    '1211':{role:'sustain',notes:'Байлу E0: лечение от HP, два случайных отскока с ослаблением, командная ульта и повышение максимального HP при избыточном лечении. Бодрость и воскрешение не срабатывают без атак и смертей.'},
    '1104':{role:'sustain',notes:'Гепард E0: ATK от DEF, щит команды, навык с Заморозкой, дополнительный урон и продвижение цели после разморозки. Авто использует базовые; навык можно включить политикой. Без входящих атак щит не расходуется.'},
    '1208':{role:'sustain',notes:'Фу Сюань E0: Матрица с HP и крит. шансом команды, HP-масштабирование базовой и ульты, лечение союзников и собственное восстановление HP. Расход HP союзником не перенаправляется Матрицей.'},
    '1002':{role:'dps',notes:'Дань Хэн E0: замедление от критических попаданий навыка, усиление ульты по замедленной цели, скорость следа и пробитие RES следующей атаки от умений союзников. Криты урона усредняются, срабатывания эффектов воспроизводятся по seed.'},
    '1109':{role:'dps',notes:'Хук E0: Горение, дополнительный урон и энергия таланта, усиленный взрывной навык после ульты, лечение и продвижение действия следов.'},
    '1210':{role:'dps',notes:'Гуйнайфэнь E0: Горение навыком и базовой, подрыв всех Горений ультой, Огненный поцелуй до трёх уровней, начальное продвижение. Авто: навык при отсутствии собственного Горения, иначе базовая.'},
    '1102':{role:'dps',notes:'Исходная Зеле E0: навык, усиление от ульты, скорость и пробивание сопротивления. Убийств на бесконечном HP нет.'},
    '1220':{role:'dps',notes:'Фэйсяо E0: заряды от атак команды, бонус-атаки, усиление навыка и ульта. Удары ульты учитывают наличие стойкости цели.'},
    '1101':{role:'support',notes:'Броня E0: продвижение кора, баф урона, командная ульта, продвижение после базовой и основные следы.'},
    '1202':{role:'support',notes:'Тинъюнь E0: Благословение со снимком ATK на применении, дополнительный урон, энергия и баф урона ульты.'},
    '1106':{role:'support',notes:'Пела E0: базовые атаки, ульта, энергия таланта. Снижение DEF не усиливает урон по болванкам с нулевой DEF.'},
    '1009':{role:'support',notes:'Аста E0: пять отскоков навыка, Заряд, командная скорость, Горение и основные следы. Отскоки воспроизводятся по seed.'},
    '1103':{role:'dps',notes:'Сервал E0: взрывной навык, Шок, продление Шока ультой, дополнительный урон таланта и начальная энергия.'},
    '1013':{role:'dps',notes:'Герта E0: AoE-навык с бонусом по высокому HP и ульта. Порог HP не пересекается: бонус-атаки не запускаются.'},
    '1105':{role:'sustain',notes:'Наташа E0: базовые атаки и генерация SP, лечение навыком и ультой при потере HP союзниками, периодическое исцеление и следы.'},
    '1003':{role:'dps',notes:'Химеко E0: навык, AoE-ульт, Горение, крит. шанс при высоком HP. При пробитии набирает заряды и запускает бонус-атаку; болванки обычного ранга.'},
    '1005':{role:'dps',notes:'Исходная Кафка E0: отдельный Шок, подрыв DoT навыком и ультой, бонус-атака после базовых союзников.'},
    '1204':{role:'dps',notes:'Цзин Юань E0: Повелитель молний с собственной шкалой, скоростью и количеством ударов; навык и ульта AoE.'},
    '1305':{role:'dps',notes:'Рацио E0: собственное ослабление, шанс бонус-атаки от числа ослаблений, усиления следов и две активации метки ульты.'},
    '1205':{role:'dps',notes:'Исходный Блэйд E0: HP и ATK-масштабирование, расход и восстановление HP, усиленная базовая, накопление заряда, бонус-атака и ульта. Усиленная версия кита не моделируется.'}
  };
  for(const id of ['1504','1507','1508','1509','8009'])models[id].notes+=' Копия навыка Керидры для этой модели пока не подключена.';
  for(const id of ['1505','1506','1510','1513'])models[id].notes+=' Копия нового навыка Керидрой пока не подключена.';
  const aliases={'8002':'8001','8004':'8003','8006':'8005','8008':'8007','8010':'8009'};
  for(const [id,base] of Object.entries(aliases))models[id]={...models[base],notes:models[base].notes.replace('мужская форма','женская форма').replace('Мужская форма','Женская форма')+' Общая боевая механика с мужской формой, отдельный профиль характеристик.'};
  const canonical=id=>aliases[id]||id;
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  function compatible(ids){return ids.filter(id=>/^80(?:0[1-9]|10)$/.test(id)).length<=1&&!(ids.includes('1001')&&ids.includes('1224'));}
  if(root.HSR_DATA?.characters['1511'])models['1511']={role:'support',notes:'Эон Аха: Эманатор, заряды, Миг Ахи и его истинный урон. Долг Радости и отдельные усиления кита союзников пока вне модели.'};
  function defaults(id,data){const v=data.character_promotions[id].values[6],get=key=>v[key].base+79*v[key].step;return {hp:get('hp'),atk:get('atk'),def:get('def'),baseHP:get('hp'),baseDef:get('def'),baseAtk:get('atk'),baseSpeed:get('spd'),speed:get('spd'),crit:get('crit_rate'),critDamage:get('crit_dmg'),damageBonus:0,elementBonus:0,effectHit:0,effectRes:0,breakEffect:0,elation:0,energyRegen:1,policy:'auto'};}
  function validateStats(stats){
    if(stats.elation!==undefined&&(!Number.isFinite(stats.elation)||stats.elation<0||stats.elation>20))throw Error('Некорректная Радость.');
    if(stats.breakEffect!==undefined&&(!Number.isFinite(stats.breakEffect)||stats.breakEffect<0||stats.breakEffect>20))throw Error('Некорректный эффект пробития.');
    for(const [key,min,max] of [['hp',1,1000000],['atk',1,100000],['def',0,100000],['baseAtk',1,100000],['baseSpeed',1,500],['speed',1,1000],['crit',0,3],['critDamage',0,20],['damageBonus',0,20],['effectHit',0,10],['energyRegen',.1,10]])if(!Number.isFinite(stats[key])||stats[key]<min||stats[key]>max)throw Error(`Некорректная характеристика ${key}.`);
    if(!['auto','basic','skill'].includes(stats.policy))throw Error('Неизвестная политика действий.');return stats;
  }
  function validateScenario(s){if(s.enemyLevel!==undefined&&(!Number.isInteger(s.enemyLevel)||s.enemyLevel<0||s.enemyLevel>100))throw Error('Уровень противника должен быть от 0 до 100.');if(s.enemyAttacks!==undefined&&!['off','training'].includes(s.enemyAttacks))throw Error('Неизвестный режим атак болванок.');if(s.requireSustain!==undefined&&typeof s.requireSustain!=='boolean')throw Error('Некорректное условие састейна.');if(s.wolfBoxGift!==undefined&&!['cycle','sword','sp','punchline'].includes(s.wolfBoxGift))throw Error('Неизвестная политика коробочек.');if(s.novaAssistPolicy!==undefined&&!['crew','all','off'].includes(s.novaAssistPolicy))throw Error('Неизвестная политика поддержки.');if(s.sparxieRefundPercent!==undefined&&(!Number.isFinite(s.sparxieRefundPercent)||s.sparxieRefundPercent<0||s.sparxieRefundPercent>100))throw Error('Шанс подарка Искры должен быть от 0 до 100%.');for(const [key,min,max] of [['targets',1,5],['cycles',1,20],['initialSP',0,5],['energyPercent',0,100],['seed',1,2147483647]])if(!Number.isInteger(s[key])||s[key]<min||s[key]>max)throw Error(`Некорректное поле боя: ${key}.`);if(s.toughness!==undefined&&(!Number.isFinite(s.toughness)||s.toughness<0||s.toughness>1000))throw Error('Стойкость должна быть от 0 до 1000.');}
  function simulate(rawIds,rawProfiles,rawScenario,data,keepLog=false){
    const ids=rawIds.map(canonical);if(new Set(ids).size!==ids.length||!compatible(rawIds))throw Error('В команде доступен один Путь Первопроходца и одна форма Март 7.');
    const profiles=Object.fromEntries(rawIds.map(id=>[canonical(id),rawProfiles[id]||defaults(id,data)])),scenario={...rawScenario,focus:canonical(rawScenario.focus)};
    const result=battleSimulate(ids,profiles,scenario,data,keepLog),out=Object.fromEntries(rawIds.map(id=>[canonical(id),id]));
    result.ids=[...rawIds];result.initialStats=Object.fromEntries(Object.entries(result.initialStats).map(([id,s])=>[out[id]||id,s]));
    for(const row of result.breakdown)row.id=out[row.id]||row.id;for(const e of result.events)e.actor=out[e.actor]||e.actor;for(const m of result.memories)m.owner=out[m.owner]||m.owner;return result;
  }
  function battleSimulate(ids,profiles,scenario,data,keepLog=false){
    if(!compatible(ids))throw Error('В команде доступен один Путь Первопроходца и одна форма Март 7.');
    validateScenario(scenario);if((!scenario.allowPartial&&ids.length!==4)||ids.length<1||ids.length>4||new Set(ids).size!==ids.length)throw Error('В команде должны быть четыре разных персонажа.');
    for(const id of ids){if(!models[id])throw Error('Нет модели боя для '+(data.characters[id]?.name||id));validateStats(profiles[id]||defaults(id,data));}
    const dotKeys=['shock','kafkaShock','burn','himekoBurn','hookBurn','guiBurn','ashenBurn','arcana','hysiWind','hysiBleed','hysiBurn','hysiShock','hysiWindE1','hysiBleedE1','hysiBurnE1','hysiShockE1','lukaBleed','sampoWind'],burnKeys=['burn','himekoBurn','hookBurn','guiBurn','ashenBurn','hysiBurn','hysiBurnE1'];
    const horizon=150+100*(scenario.cycles-1),events=[],damageByTarget=Array(scenario.targets).fill(0),dummies=Array.from({length:scenario.targets},()=>({turn:0,distance:10000,slowUntil:0,firekiss:0,firekissUntil:0,shock:null,kafkaShock:null,burn:null,himekoBurn:null,ratioDebuff:0,exposed:0}));
    const maxSP=5+(ids.includes('1306')?2+(profiles['1306']?.eidolon>=4?1:0):0)+(ids.includes('1015')?2:0)+(ids.includes('1508')?2:0);
    let copying=null,turnOwner=null;
    let now=0,sp=scenario.initialSP,seed=scenario.seed>>>0,steps=0,attacks=0,turnSPSpent=0,activeActor=null,enemySerial=0,enemyPhase=false,enemyIndex=-1,actionSerial=0,eventSerial=0,hpLossSerial=0;
    const creditedDebuffs=new Set(),maxToughness=scenario.toughness||0,breakBase=3767.5533;
    for(const d of dummies){d.toughness=maxToughness;d.exo=0;d.breaks=0;}
    const rng=()=>{seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;return (seed>>>0)/4294967296;};
    const actors=ids.map(id=>({id,s:{...defaults(id,data),...(profiles[id]||{})},distance:10000,turn:0,buffs:[],energy:['1220','1308','1407','1408','1415','1506'].includes(id)?0:(data.characters[id].max_sp||0)*scenario.energyPercent/100,resource:id==='1220'?3:id==='1308'?5:0,fuaReady:true,fuaSinceTurn:true,charges:0,blessing:null,total:0,normal:0,ults:0,followups:0,actionKind:'basic',currentHP:(profiles[id]||defaults(id,data)).hp,hpLost:0,bladeCharges:0,ratioStacks:0,ratioMarks:0}));
    actors.forEach(a=>{const d=defaults(a.id,data);a.s.baseHP??=d.hp;a.s.baseDef??=d.def;a.s.breakEffect??=0;if(G)G.init(a,data,scenario.targets);});
    const lord=ids.includes('1204')?{distance:10000,hits:3,exUntil:4}:null;
    const numby=ids.includes('1112')?{distance:10000,enhanced:0,acting:false}:null;
    const fuyuan=ids.includes('1222')?{distance:10000,actions:0,acting:false}:null;
    const dragon=ids.includes('1414')?{distance:10000,active:false,enhanced:0,acting:false}:null;
    const finalQueue=[],aha={distance:10000,punchline:0,acting:false,count:0},elationActors=actors.filter(a=>data.characters[a.id].path==='Elation');
    const memories=[],memo=id=>memories.find(m=>m.owner.id===id),form={active:false,distance:0,turns:0,scourge:0};
    const find=id=>actors.find(a=>a.id===id),core=find(scenario.focus)||actors[0],skill=(id,suffix)=>data.character_skills[id+suffix];
    const aeon=find('1511');
    const skillLevels={};
    for(const actor of actors){
      for(const rankId of data.characters[actor.id].ranks.slice(0,actor.s.eidolon||0)){
        for(const {id,num} of data.character_ranks[rankId]?.level_up_skills||[])skillLevels[id]=(skillLevels[id]||0)+num;
      }
    }
    function params(id,suffix){
      const levels=skill(id,suffix)?.params;
      if(!levels?.length)return [];
      const base=suffix==='01'?5:9;
      const bonus=skillLevels[id+suffix]||0;
      return levels[bonus?Math.min(levels.length-1,base+bonus):base]||[];
    }
    const focusFor=actor=>core!==actor&&!core.departed?core:actors.filter(a=>a!==actor&&!a.departed).sort((a,b)=>(models[b.id].role==='dps')-(models[a.id].role==='dps')||b.s.atk-a.s.atk)[0]||actor;
    for(const [id,name] of [['1402','Швея'],['1407','Крылья Смерти'],['1409','Ика'],['1413','Тьмуша'],['8007','Мемо'],['1415','Демиург'],['1512','Музыканты ясного неба']]){const owner=find(id);if(owner){const m={owner,name,active:false,distance:10000,baseHP:0,baseSpeed:0,stacks:0,turn:0,acting:false};m.unit={id,s:owner.s,turn:0,buffs:[],currentHP:0,hpLost:0,bladeCharges:0,_memo:m};memories.push(m);}}
    function buff(target,source,key,values,duration){target.buffs=target.buffs.filter(b=>!(b.source===source&&b.key===key));target.buffs.push({source,key,values,expires:target.turn+duration});}
    function sundayCrit(target,source){
      const [crit,duration]=params('1313','04');
      const previous=target.buffs.find(b=>b.key==='sundayCrit'&&b.source===source.id&&b.expires>=target.turn);
      const stacks=source.s.eidolon>=6?Math.min(3,(previous?.values.crit||0)/crit+1):1;
      buff(target,source.id,'sundayCrit',{crit:crit*stacks},duration+(source.s.eidolon>=6?1:0));
    }
    function stat(actor,excludeConverted=false,forMemo=false){
      if(actor._memo)return memoStat(actor._memo);
      const shared=new Set(['bronyaUlt','astaUlt','ruanSpeed','huohuoUlt','cipher','watchmaker','dahliaBE','fugueBreak','sundaySkill','sundayCrit','netherRoar','saverAura']);
      const bonus={atk:0,hp:0,def:0,flatHP:0,flatAtk:0,speed:0,speedPct:0,crit:0,critDamage:0,damage:0,resPen:0};for(const b of actor.buffs)if(!forMemo||shared.has(b.key))for(const [k,v] of Object.entries(b.values))bonus[k]=(bonus[k]||0)+v;
      const eq=G?G.modifiers(actor,actors,data):{};for(const key of ['atk','hp','def','speed','speedPct','crit','critDamage','damage'])bonus[key]+=(eq[key]||0);
      const asta=find('1009');if(asta)bonus.atk+=asta.charges*params('1009','04')[0];
      if(find('1101'))bonus.damage+=.1;if(asta&&data.characters[actor.id].element==='Fire')bonus.damage+=.18;
      const ruan=find('1303'),robin=find('1309'),sparkle=find('1306'),fu=find('1208');
      if(ruan){if(ruan.meiSkillUntil>ruan.turn)bonus.damage+=params('1303','02')[0]+Math.min(.36,Math.max(0,breakValue(ruan)-1.2)*.6);if(ruan.meiUltUntil>ruan.turn)bonus.resPen+=params('1303','03')[0];}
      if(robin){bonus.critDamage+=params('1309','04')[0];if(robin.robinSkillUntil>robin.turn)bonus.damage+=params('1309','02')[0];if(robin.concertoUntil>now){bonus.flatAtk+=robin.concertoATK;if(robin.s.eidolon>=1)bonus.resPen+=.24;if(robin.s.eidolon>=2)bonus.speedPct+=.16;}}
      const luochaAura=find('1203');if(luochaAura?.s.eidolon>=1&&luochaAura.fieldUntil>luochaAura.turn)bonus.atk+=.2;
      if(sparkle){if(sparkle.s.eidolon>=1&&actor.buffs.some(b=>b.key==='cipher'&&b.expires>=actor.turn))bonus.atk+=.4;const n=actors.filter(a=>data.characters[a.id].element==='Quantum').length;bonus.atk+=.15;if(data.characters[actor.id].element==='Quantum')bonus.atk+=n>=3?.3:n===2?.15:.05;const stacks=actor.buffs.find(b=>b.source==='1306'&&b.key==='sparkleTalent')?.values.stacks||0;bonus.damage+=stacks*(params('1306','04')[1]+(actor.buffs.some(b=>b.source==='1306'&&b.key==='cipher')?params('1306','03')[2]:0));}
      if(fu&&fu.matrixUntil>fu.turn){bonus.crit+=params('1208','02')[4];bonus.flatHP+=fu.matrixHP;if(fu.s.eidolon>=1)bonus.critDamage+=.3;}
      const hh=find('1217');if(hh?.s.eidolon>=1&&hh.divineUntil>hh.turn)bonus.speedPct+=.12;
      const avent=find('1304');if(avent?.s.eidolon>=1&&actor.avenShield?.expires>=actor.turn)bonus.critDamage+=.2;
      if(actor.id==='1304'&&actor.s.eidolon>=6)bonus.damage+=.5*Math.min(3,actors.filter(a=>[a.shield,a.avenShield,a.marchShield,a.trailShield,a.dragonShield].some(shield=>shield?.expires>=a.turn)).length);
      const sanctifier=find('1403');if(sanctifier&&sanctifier.sanctifyUntil>sanctifier.turn)bonus.resPen+=params(sanctifier.id,'02')[0];
      let r={hp:actor.s.hp+actor.s.baseHP*bonus.hp+bonus.flatHP,def:actor.s.def+actor.s.baseDef*bonus.def,atk:actor.s.atk+actor.s.baseAtk*bonus.atk+bonus.flatAtk,speed:actor.s.speed+actor.s.baseSpeed*bonus.speedPct+bonus.speed,crit:actor.s.crit+bonus.crit,critDamage:actor.s.critDamage+bonus.critDamage,damage:actor.s.damageBonus+bonus.damage,resPen:bonus.resPen,energyRegen:actor.s.energyRegen+(eq.energyRegen||0)+(bonus.energyRegen||0),effectHit:actor.s.effectHit+(eq.effectHit||0)+(bonus.effectHit||0)};
      if(actor.id==='1302'){r.crit+=(actor.apotheosis||0)*params(actor.id,'04')[1];if(actor.s.eidolon>=1)r.critDamage+=(actor.apotheosis||0)*.04;}
      if(actor.id==='1212'&&actor.transmigration){r.crit+=params(actor.id,'04')[6];if(actor.s.eidolon>=6)r.critDamage+=.5;}
      if(actor.id==='1002'&&actor.s.eidolon>=1)r.crit+=.12; // Training targets stay above 50% HP.
      if(actor.id==='1111'&&actor.s.eidolon>=4)r.atk+=actor.s.baseAtk*Math.min(4,actor.lukaE4||0)*.05;
      if(actor.id==='1207'&&actor.s.eidolon>=4&&actor.bow>0)r.damage+=.3;
      if(actor.id==='1104')r.atk+=actor.gepardATK||0;
      if(actor.id==='1209'){if(actor.soulUntil>=actor.turn){const p=params(actor.id,'04');r.crit+=p[0];r.critDamage+=p[1];if(actor.s.eidolon>=2)r.energyRegen+=.1;}if(actor.s.eidolon>=4&&actor.currentHP>=r.hp*.8)r.resPen+=.12;}
      if(actor.id==='1218')r.atk+=actor.s.baseAtk*Math.min(2.4,Math.max(0,r.effectHit-.8)*4);
      if(actor.id==='1304')r.crit+=Math.min(.48,Math.max(0,r.def-1600)*.0002);
      const rapper=find('1317');if(rapper?.s.eidolon>=4&&rapper.ink>0)r.speed+=actor.s.baseSpeed*.12;
      const herta=find('1401');if(herta?.s.eidolon>=4&&data.characters[actor.id].path==='Mage')r.speed+=actor.s.baseSpeed*.12;
      if(actor.id==='1401'&&actor.s.eidolon>=6)r.resPen+=.2;
      if(actor.id==='1314'){if(actor.s.eidolon>=2&&actor.pawn>=15)r.crit+=.18;if(actor.s.eidolon>=6&&actor.debtUntil>actor.turn)r.resPen+=.2;r.critDamage+=(actor.pawn||0)*.024;r.atk+=actor.s.baseAtk*(actor.pawn||0)*.005;}
      if(actor.id==='1307')r.damage+=Math.min(.72,r.effectHit*.6);
      const hysi=find('1410');if(actor.id==='1410'||(!excludeConverted&&hysi?.s.eidolon>=2&&hysi.hysiUntil>hysi.turn))r.damage+=Math.min(.9,Math.max(0,(actor===hysi?r.effectHit:stat(hysi).effectHit)-.6)*1.5);
      if(actor.id==='1222')r.atk+=actor.s.baseAtk*Math.min(.5,breakValue(actor)*.25);
      if(actor.id==='1310'&&actor.combustionUntil>now){r.speed+=params(actor.id,'03')[2];if(actor.s.eidolon>=4)r.effectRes+=.5;if(actor.s.eidolon>=6)r.resPen+=.2;}
      if(actor.id==='1205'){if(actor.s.eidolon>=2&&actor.bladeUntil>actor.turn)r.crit+=.15;r.hp+=actor.s.baseHP*(actor.bladeE4||0)*.2;}
      const yukong=find('1207'),cerydra=find('1412'),dhpt=find('1414');
      if(yukong?.bow>0){r.atk+=actor.s.baseAtk*params('1207','02')[1];if(yukong.bowCrit){const p=params('1207','03');r.crit+=p[1];r.critDamage+=p[2];}}
      if(yukong&&data.characters[actor.id].element==='Imaginary')r.damage+=.12;
      if(actor.id==='1014'){r.crit+=.2;r.critDamage+=Math.min(8,actor.resonanceEarned||0)*.04;if(actor.s.eidolon>=4)r.resPen+=.08+.04*Math.min(3,actor.ults);}
      if(actor.id==='1008')r.damage+=params(actor.id,'04')[0]*(1-actor.currentHP/Math.max(1,r.hp));
      if(actor.id==='8003')r.def+=actor.s.baseDef*(actor.trailDefense||0)*.1;
      if(actor.id==='8001'){r.atk+=actor.s.baseAtk*(actor.destroyStacks||0)*params(actor.id,'04')[0];r.def+=actor.s.baseDef*(actor.destroyStacks||0)*params(actor.id,'04')[0]*.5;}
      if(actor.id==='1407'){if(!forMemo&&actor.currentHP>=r.hp*.5)r.speed+=actor.s.baseSpeed*.4;r.damage+=(actor.castBoostUntil>actor.turn?actor.castStacks||0:0)*.2;if(memo('1407')?.active)r.resPen+=.2;if(actor.s.eidolon>=6)r.resPen+=.2;}
      else if(memo('1407')?.active)r.resPen+=.2;if(actor.s.eidolon>=6)r.resPen+=.2;
      const hyacine=find('1409');if(hyacine?.rainUntil>hyacine?.turn)r.hp+=actor.s.baseHP*(hyacine.s.eidolon>=1?.8:.3)+600;
      if(memo('1409')?.active&&hyacine.s.eidolon>=6)r.resPen+=.2;
      if(find('1413')?.s.eidolon>=6)r.resPen+=.2;
      if(actor.id==='1413'&&actor.s.eidolon>=2)r.critDamage+=.4;
      if(actor.id==='1409'){r.crit+=1;if(r.speed>200){r.hp+=actor.s.baseHP*.2;if(actor.s.eidolon>=4)r.critDamage+=(r.speed-200)*.02;}}
      const gm=memo('1402');if(actor.id==='1402'&&actor.supremeUntil>now&&gm?.active){if(!forMemo)r.speed+=actor.s.baseSpeed*.15*gm.stacks;if(actor.s.eidolon>=6)r.resPen+=.2;const ownerSpeed=forMemo?stat(actor).speed:r.speed;r.atk+=7.2*ownerSpeed+3.6*memoSpeed(gm);}
      if(actor.id==='1408'){r.atk+=actor.s.baseAtk*((actor.phainonAtkStacks||0)*.5+(form.active?.8:0));if(form.active){r.hp+=actor.phainonFormHP||0;if(actor.s.eidolon>=2)r.resPen+=.2;if(actor.s.eidolon>=1&&form.actions<=3)r.critDamage+=.5;}}
      if(actor.id==='1015'&&actor.archerCritUntil>=actor.turn)r.critDamage+=1.2;
      if(actor.id==='1404'){r.crit+=actor.mydeiCrit||0;if(actor.vendetta){r.hp+=actor.vendettaHP||0;r.def=0;if(actor.s.eidolon>=4)r.critDamage+=.3;}}
      if(actor.id==='1201'&&actor.kong)r.atk+=actor.s.baseAtk*.72;
      if(actor.id==='1412'){r.crit+=1;r.critDamage+=Math.min(3.6,Math.max(0,r.atk-2000)*.0018);}
      if(!forMemo&&!excludeConverted&&cerydra?.merit===actor.id){r.atk+=(cerydra===actor?(cerydra.meritOwnAtk||0):stat(cerydra,true).atk)*.24;if(cerydra.cCharge>=6||actor.peerageOriginal)r.resPen+=.1;if(cerydra.s.eidolon>=2)r.damage+=.4;}if(cerydra?.merit&&(actor===cerydra||actor.id===cerydra.merit)){if(cerydra.s.eidolon>=6)r.resPen+=.2;if(actor===cerydra&&cerydra.s.eidolon>=2)r.damage+=1.6;}
      if(!forMemo&&!excludeConverted&&dhpt?.bondmate===actor.id)r.atk+=(dhpt===actor?dhpt.bondOwnAtk||0:stat(dhpt,true).atk)*.15;
      if(actor.id==='1315'){const be=breakValue(actor);r.crit+=Math.min(.3,be*.1);r.critDamage+=Math.min(1.5,be*.5);}
      if(find('1222')?.s.eidolon>=6&&(fuyuan.actions>0||fuyuan.acting))r.resPen+=.2;
      if(actor.id==='1224'&&actor.s.eidolon>=1&&actor.master)r.speed+=actor.s.baseSpeed*.1;
      if(actor.id==='1214')r.damage+=Math.min(2.4,breakValue(actor));
      if(actor.id==='1406'){r.crit+=r.speed>=170?.5:r.speed>=140?.25:0;}
      const erudition=actors.filter(a=>data.characters[a.id].path==='Mage').length,anaxa=find('1405'),tribbi=find('1403');
      if(find('1401')&&erudition>=2)r.critDamage+=.8;
      if(anaxa){if(erudition>=2||anaxa.s.eidolon>=6)r.damage+=.5;if(actor===anaxa&&(erudition===1||anaxa.s.eidolon>=6))r.critDamage+=1.4;}
      if(tribbi?.tribZoneUntil>tribbi?.turn&&actor===tribbi){const sum=actors.reduce((n,a)=>n+(a===actor?r.hp:stat(a).hp),0);r.hp+=sum*.09;}
      if(tribbi===actor&&actor.tribStacksUntil>actor.turn)r.damage+=(actor.tribStacks||0)*.72;
      if(actor.id==='1308'){r.damage+=actor.acheronBoost||0;if(actor.acheronUlting)r.resPen+=params('1308','04')[1];}
      if(actor===aeon&&facesActive())r.crit+=aeon.s.eidolon>=2?.2:.12;
      if(actor.id==='1204'&&actor.s.exEidolon&&actor.turn<=lord.exUntil)r.damage+=2.4;
      const sunday=find('1313');
      if(sunday?.beatified===actor.id&&sunday.beatifiedUntil>sunday.turn){
        r.critDamage+=sunday.beatifiedCD;
        if(sunday.s.eidolon>=2)r.damage+=.3;
      }
      if(sunday?.s.eidolon>=6){
        const crit=actor.buffs.find(b=>b.key==='sundayCrit'&&b.expires>=actor.turn)?.values.crit||0;
        r.critDamage+=Math.min(crit,Math.max(0,r.crit-1))*2;
      }
      if(actor.id==='1003'&&actor.currentHP>=r.hp*.8)r.crit+=.15;
      if(actor.id==='1009'&&actor.s.eidolon>=4&&actor.charges>=2)r.energyRegen+=.15;
      if(actor.id==='1305'){r.crit+=actor.ratioStacks*.025;r.critDamage+=actor.ratioStacks*.05;}
      sixthStats(actor,r,forMemo);finalStats(actor,r,forMemo);
      if(G){const extra=G.conditional(actor,r);r.crit+=extra.crit;r.critDamage+=extra.critDamage;r.damage+=extra.damage;r.atk+=actor.s.baseAtk*extra.atk;}if(!Number.isFinite(r.speed)||r.speed<=0)throw Error('После бонусов наборов скорость должна оставаться положительной.');return r;
    }
    function record(actor,label,damage=0,kind='effect'){if(keepLog)events.push({time:now,actor:actor?.id||'dummy',label,damage,kind,sp,energy:actor?.energy||0,resource:actor?.resource||0,special:actor?.mood??actor?.fervor??actor?.gems??actor?.resource??0,punchline:aha.punchline,banger:actor?banger(actor):0,memory:memories.filter(m=>m.active).map(m=>m.name+' '+Math.round(m.unit.currentHP)+'/'+Math.round(memoStat(m).hp)+' HP').join(' · ')+(form.active?' · Каослана '+form.turns+'/8':'')+(elationActors.length?' · Юмор '+aha.punchline+' · Хит '+(actor?banger(actor):0):''),toughness:dummies.map(d=>d.toughness),exo:dummies.map(d=>d.exo)});}
    function beginAction(actor){actor.advanceSnapshot=Object.fromEntries(actors.map(a=>[a.id,a.distance]));activeActor=actor;actor.actionKey=++actionSerial;actor.actionSPSpent=0;const mydei=find('1404');if(mydei)mydei.healCharge=0;actor.tribAttackDamage=0;const aglaea=find('1402');if(aglaea?.s.eidolon>=2)aglaea.aglaeaChain=actor===aglaea?Math.min(3,(aglaea.aglaeaChain||0)+1):0;actor.arcanaProcs={};actor.toughnessUsed={};actor.breakHits={};actor.karmaTargets=new Set();const cast=find('1407');if(cast)cast.healCaps=new Map();for(const d of dummies)d.hysiCount=0;}
    function acheronGain(amount,target=0){const a=find('1308');if(!a||a.acheronUlting)return;a.resource=Math.min(12,a.resource+amount);dummies[target].knots=(dummies[target].knots||0)+amount;}
    const mostKnots=()=>allTargets().reduce((a,b)=>(dummies[a].knots||0)>=(dummies[b].knots||0)?a:b,0);
    function acheronEX(actor){
      beginAction(actor);
      actor.followups++;
      if(G)G.followupStart(actor);
      const options={followup:true,ultimate:true,group:true,toughness:0};
      hit(actor,3,allTargets(),'Ахерон EX · бонус-атака',options);
      for(let n=0;n<6;n++)hit(actor,.8,[Math.floor(rng()*dummies.length)],'Ахерон EX · отскок',options);
      acheronGain(1,mostKnots());
      if(G)G.followupEnd(actor,actors);
      afterAttack(actor,false,'followup');
    }
    function imbibitorEX(actor){
      beginAction(actor);
      actor.followups++;
      buff(actor,actor.id,'imbibitorEX',{damage:2.4},3);
      if(G)G.followupStart(actor);
      for(let n=0;n<6;n++)hit(actor,5/6,allTargets(),'Пожиратель Луны EX · удар',{kind:'basic',followup:true,group:true,toughness:0});
      actor.squama=Math.min(params('1213','03')[3]+1,(actor.squama||0)+1);
      actor.resource=actor.squama;
      if(G)G.followupEnd(actor,actors);
      afterAttack(actor,false,'followup');
    }
    function lordAdd(actor,regular,extra){
      const extraHits=actor.s.exEidolon&&actor.turn<=lord.exUntil?extra:0;
      lord.hits=Math.min(actor.s.exEidolon?30:10,lord.hits+regular+extraHits);
      if(lord.hits>=30)lord.distance=0;
    }
    function debuffApplied(actor,target=0){if(G)G.debuff(actor);const key=activeActor?'a'+activeActor.actionKey:'e'+enemySerial+':'+actor.id;if(!creditedDebuffs.has(key)){creditedDebuffs.add(key);acheronGain(1,target);}}
    function arcanaAdd(index,chance=.65){const actor=find('1307');if(!actor||rng()>=effectChance(actor,chance,index))return;const d=dummies[index];d.arcanaStacks=Math.min(50,(d.arcanaStacks||0)+1+(actor.s.eidolon>=6&&rng()<.5?1:0));d.arcana={owner:actor.id,expires:Infinity,coefficient:2.4};debuffApplied(actor,index);}
    function dotTypes(index){const d=dummies[index],types=new Set();for(const k of dotKeys)if(d[k]){if(['shock','kafkaShock','hysiShock','hysiShockE1'].includes(k))types.add('shock');else if(burnKeys.includes(k))types.add('burn');else if(['hysiBleed','hysiBleedE1','lukaBleed'].includes(k))types.add('bleed');else if(k==='hysiWind'||k==='hysiWindE1'||k==='sampoWind'||k==='arcana')types.add('wind');}for(const [element,type] of [['Physical','bleed'],['Fire','burn'],['Wind','wind'],['Thunder','shock']])if(d.breakStatuses?.[element]&&find('1307')?.s.eidolon>=1)types.add(type);if(d.epiphanyUntil>d.turn&&d.arcana)for(const t of ['wind','bleed','burn','shock'])types.add(t);return types;}
    function hysiApply(targets){const actor=find('1410');if(!actor)return;for(const i of targets){const d=dummies[i],have=dotTypes(i),missing=['wind','bleed','burn','shock'].filter(k=>!have.has(k)),type=(missing.length?missing:['wind','bleed','burn','shock'])[Math.floor(rng()*(missing.length||4))];if(rng()<effectChance(actor,1,i)){const key={wind:'hysiWind',bleed:'hysiBleed',burn:'hysiBurn',shock:'hysiShock'}[type];const p=params(actor.id,'04');d[key]={owner:actor.id,expires:d.turn+p[4],coefficient:p[1]};debuffApplied(actor,i);if(actor.s.eidolon>=1&&rng()<effectChance(actor,1,i)){d[key+'E1']={...d[key]};debuffApplied(actor,i);}}}}
    function hysiExtra(index){const h=find('1410'),d=dummies[index];if(!h||!(h.hysiUntil>h.turn)||(d.hysiCount||0)>=(h.s.eidolon>=6?12:8))return;d.hysiCount=(d.hysiCount||0)+1;hit(h,params(h.id,'03')[3]+(h.s.eidolon>=6?.2:0),[index],'Зона Гисиленсы · DoT',{dot:true,noHysi:true});if(find('1307')){if(enemyPhase)arcanaAdd(index);else{const owner=activeActor||h;owner.arcanaProcs??={};if((owner.arcanaProcs[index]||0)<3){owner.arcanaProcs[index]=(owner.arcanaProcs[index]||0)+1;arcanaAdd(index);}}}}
    function interpret(index,count=1){const h=find('1401');if(!h)return;const d=dummies[index],before=d.interpret||0;d.interpret=Math.min(42,before+count);h.answers=Math.min(99,(h.answers||0)+d.interpret-before);}
    function trueHit(actor,amount,targets,label,kind='true'){for(const i of targets){const value=amount/targets.length;actor.total+=value;damageByTarget[i]+=value;}record(actor,label,amount,kind);}
    function anaxaSkill(actor){beginAction(actor);if(actor.odeAnaxaReady){actor.odeAnaxaReady=false;const c=find('1415');actor.odeAnaxaUntil=actor.turn+1;for(const ally of actors)if(data.characters[ally.id].path==='Mage')buff(ally,'1415','odeKnowledge',{atk:.6},2);}actor.actionKind='skill';if(actor.s.eidolon>=1&&!actor.anaxaE1Used){actor.anaxaE1Used=true;gainSP();record(actor,'Анакса E1 · восстановлено 1 SP');}if(actor.s.eidolon>=4){actor.anaxaE4=Math.min(2,(actor.anaxaE4Until>=actor.turn?actor.anaxaE4:0)+1);actor.anaxaE4Until=actor.turn+2;buff(actor,actor.id,'anaxaE4',{atk:.3*actor.anaxaE4},2);}if(G)G.beforeSkill(actor);energy(actor,30);const available=allTargets(),targets=[];for(let n=0;n<5+(actor.odeAnaxaHits||0);n++){const i=n===0?0:available.length?available[Math.floor(rng()*available.length)]:Math.floor(rng()*dummies.length);targets.push(i);const at=available.indexOf(i);if(at>=0)available.splice(at,1);if(actor.s.eidolon>=1){dummies[i].anaxaDefUntil=dummies[i].turn+2;debuffApplied(actor,i);}hit(actor,params(actor.id,'02')[0],[i],'Анакса · попадание',{bonus:params(actor.id,'02')[2]*dummies.length+.3});}afterAttack(actor);if(G)G.afterSkill(actor);}
    function hertaSkill(actor){const enhanced=(actor.inspiration||0)>0;if(enhanced&&!copying)actor.inspiration--;interpret(0);const stacks=(dummies[0].interpret||1)+(enhanced&&actor.s.eidolon>=1?.5*Math.max(...dummies.slice(0,3).map(d=>d.interpret||1)):0),double=actors.filter(a=>data.characters[a.id].path==='Mage').length>=2?2:1,boost=enhanced&&stacks>=42?.5:0;hit(actor,enhanced?params(actor.id,'09')[0]:params(actor.id,'02')[0],[0],'Герта · первый удар',{bonus:boost});for(let n=0;n<2;n++)hit(actor,enhanced?params(actor.id,'09')[0]:params(actor.id,'02')[0],allTargets().slice(0,n?5:3),'Герта · повтор навыка',{bonus:boost});if(enhanced){for(const i of allTargets())hit(actor,params(actor.id,'09')[2]+stacks*params(actor.id,'04')[i===0?0:1]*double,[i],'Герта · завершение усиленного навыка',{bonus:boost});if(!copying){dummies[0].interpret=actor.s.eidolon>=1?15:1;if(actor.s.eidolon>=2)actor.distance=Math.max(0,actor.distance-3500);}}afterAttack(actor);}
    function fuyuanTurn(extra=false){const actor=find('1222');if(!actor||fuyuan.acting||fuyuan.actions<=0)return;fuyuan.acting=true;beginAction(actor);if(!extra){fuyuan.actions--;fuyuan.distance=10000;}actor.followups++;const p=params(actor.id,'04'),all=allTargets();hit(actor,p[1],all,'Фуюань · бонус-атака',{followup:true,group:true});hit(actor,p[7],[Math.floor(rng()*dummies.length)],'Фуюань · дополнительный удар',{followup:true,group:true});if(actor.s.eidolon>=6)for(let n=0;n<4;n++){const intact=all.filter(i=>dummies[i].toughness>0),pool=intact.length?intact:all;hit(actor,.5,[pool[Math.floor(rng()*pool.length)]],'Фуюань E6 · дополнительный удар',{followup:true,group:true,toughness:5});}if(G)G.followupEnd(actor,actors);const allies=livingAllies();if(actor.s.eidolon>=4&&allies.length)heal([...allies].sort((a,b)=>a.currentHP-b.currentHP)[0],stat(actor).atk*.4,actor);for(const a of allies)heal(a,stat(actor).atk*p[2]+p[3],actor);afterAttack(actor,false,'followup');fuyuan.acting=false;actor.fuyuanActive=fuyuan.actions>0;}
    function yunliCounter(actor,incoming=false,target=0){actor.parry=false;beginAction(actor);actor.followups++;actor.actionKind='ultimate';const c=incoming||actor.yunliCull;actor.yunliCull=!c;buff(actor,actor.id,'yunliAtk',{atk:.3},1);const p=params(actor.id,'03'),s=stat(actor);if(actor.s.eidolon>=6){s.crit+=.15;s.resPen+=.2;}const options={followup:true,ultimate:true,extraCritDamage:p[1],group:true,statSnapshot:s,bonus:actor.s.eidolon>=1?.2:0};hit(actor,p[0],[target],'Интуит · '+(c?'Истребление':'Вырубка'),options);if(dummies.length>1)hit(actor,p[5],[target-1,target+1].filter(i=>i>=0&&i<dummies.length),'Интуит · соседние цели',options);if(c)for(let n=0;n<p[3]+(actor.s.eidolon>=1?3:0);n++)hit(actor,p[6],[Math.floor(rng()*dummies.length)],'Интуит · дополнительный удар',options);if(actor.s.eidolon>=4)buff(actor,actor.id,'yunliE4',{effectRes:.5},1);if(G)G.followupEnd(actor,actors);afterAttack(actor,true,'followup');}
    function breakValue(actor){const hmc=find('8005'),dahlia=find('1321');const teamBonus=(hmc?.s.eidolon>=4&&actor!==hmc?breakValue(hmc)*.15:0)+(dahlia?.s.eidolon>=6&&actor.id===dahlia.partner?1.5:0);const eq=G?G.modifiers(actor,actors,data):{},speed=actor.s.speed+actor.s.baseSpeed*(eq.speedPct||0)+(eq.speed||0)+actor.buffs.reduce((n,b)=>n+(b.values.speed||0)+actor.s.baseSpeed*(b.values.speedPct||0),0);return teamBonus+actor.s.breakEffect+(actor.eq?.p.BreakDamageAddedRatioBase||0)+(eq.breakEffect||0)+actor.buffs.reduce((n,b)=>n+(b.values.breakEffect||0),0)+(find('1303')?.2:0)+(actor.id==='1225'?.3:0)+(hasFoxPrayer(actor)?params('1225','02')[1]:0)+(actor.id==='1301'&&actor.s.eidolon>=6?.2:0)+(actor.id==='1206'&&actor.s.eidolon>=4?.4:0)+(hmc?.hmcUntil>hmc?.turn?params(hmc.id,'03')[2]:0)+(actor.id==='1317'&&actor.ink>0?.3:0)+(actor.id==='1310'?Math.max(0,stat(actor).atk-1800)*.0008:0)+(G?.has(actor,'307')&&speed>=145?.2:0);}
    function slowed(index){const d=dummies[index];return d.slowUntil>d.turn||d.weltSlowUntil>d.turn||d.imprisonedUntil>d.turn;}
    // Toughness uses the current in-game scale: a normal basic removes 10.
    // Older models aggregate damage packets: their per-target toughness budget is
    // consumed once per action. New break models explicitly split every packet.
    function toughnessAmount(actor,target,label,options,kind){
      if(options.toughness!==undefined)return options.toughness;
      if(options.dot||kind==='additional'||kind==='dot')return 0;
      const adjacent=/соседние|взрыв/.test(label),id=actor.id;
      if(/отскок|попадание/.test(label)&&['1009','1004','1304','1405'].includes(id))return id==='1304'?10/7:5;
      if(/Повелитель молний/.test(label))return adjacent?0:5;
      const budgets={basic:10,skill:20,ultimate:20,followup:10};
      const overrides={'1009':{skill:10},'1013':{skill:10},'1107':{skill:10},'1204':{skill:10},'1302':{skill:10,ultimate:20},'1222':{skill:10,ultimate:20,followup:10},'1403':{basic:10,followup:5,ultimate:20},'1225':{basic:actor.fugueUntil>actor.turn?10:10},'1314':{basic:10,ultimate:20,followup:10},'1213':{basic:actor.s.policy==='basic'?10:40,ultimate:20}};
      const amount=adjacent?((overrides[id]?.[kind]??budgets[kind]??0)/2):(overrides[id]?.[kind]??budgets[kind]??0);
      actor.toughnessUsed??={};const key=target+':'+kind;if(actor.toughnessUsed[key])return 0;actor.toughnessUsed[key]=true;return amount;
    }
    function hasFoxPrayer(actor,fugue=find('1225')){
      return Boolean(fugue&&fugue.fugueUntil>fugue.turn&&(fugue.prayer===actor.id||(fugue.s.eidolon>=6&&actor!==fugue)));
    }
    function efficiency(actor){const fugue=find('1225');return 1+(actor.id==='1222'&&actor.s.eidolon>=1?.5:0)+(fugue?.s.eidolon>=1&&hasFoxPrayer(actor,fugue)?.5:0)+(actor.id==='1225'&&actor.s.eidolon>=6?.5:0)+(actor.id==='1301'&&actor.s.eidolon>=6?.2:0)+(find('1303')?.meiSkillUntil>find('1303')?.turn?.5:0)+(find('1321')?.dahliaUntil>find('1321')?.turn?.5:0)+(actor.id==='1310'&&actor.combustionUntil>now?.5+(actor.fireflyEnhanced&&actor.s.eidolon>=6?.5:0):0)+(actor.id==='1317'&&actor.ink>0?params(actor.id,'03')[0]:0);}
    function defenseMultiplier(actor,index,kind,summon=false,elationDamage=false){
      if(!scenario.enemyLevel)return 1;
      const enemy=dummies[index];
      let reduction=actor===aeon&&facesActive()?(aeon.s.eidolon>=2?.6:.3):0;
      if(facesActive()&&find('1501'))reduction+=aeon.s.eidolon>=2?.2:.15;
      if(actor.id==='1302'&&actor.s.eidolon>=6&&kind==='ultimate')reduction+=.3;
      if(actor.id==='1310'&&actor.s.eidolon>=1&&actor.fireflySkill&&['skill','break','superbreak'].includes(kind))reduction+=.15;
      const recipient=actor._memo?.owner||actor;
      const sundayDef=recipient.buffs.find(b=>b.key==='sundayDef'&&b.expires>=recipient.turn);
      if(sundayDef)reduction+=summon?.4:.16;
      if(find('1306')?.s.eidolon>=2)reduction+=(recipient.buffs.find(b=>b.key==='sparkleTalent'&&b.expires>=recipient.turn)?.values.stacks||0)*.08;
      const mei=find('1303');if(mei?.s.eidolon>=1&&mei.meiUltUntil>mei.turn)reduction+=.2;
      const cerydra=find('1412'),tribbie=find('1403'),dan=find('1414');
      if(find('1513')?.s.eidolon>=4&&actor.buffs.some(b=>b.key==='waveE4'))reduction+=.18;
      const gil=find('1509');if(gil?.buffs.some(b=>b.key==='kingBurden')&&(actor===gil||gil.s.eidolon>=1))reduction+=params(gil.id,'04')[2];
      if(actor.id==='1505'&&actor.s.eidolon>=4)reduction+=.15;
      if(elationDamage&&find('1502')?.s.eidolon>=1)reduction+=.2;
      if(dan?.s.eidolon>=6&&dan.bondmate===actor.id)reduction+=.12;
      if(find('1415')?.demiE6Defense)reduction+=.2;
      if(actor.id==='1404'&&actor.s.eidolon>=2&&actor.vendetta)reduction+=.15;
      if(actor.id==='1402'&&actor.s.eidolon>=2)reduction+=.14*(actor.aglaeaChain||0);
      if(cerydra?.s.eidolon>=1&&cerydra.merit===actor.id)reduction+=.16+(kind==='skill'&&(cerydra.cCharge>=6||actor.peerageOriginal)?.2:0);
      if(tribbie?.s.eidolon>=4&&tribbie.sanctifyUntil>tribbie.turn)reduction+=.18;
      if(actor.id==='1314'&&actor.buffs.some(b=>b.key==='jadeE4'))reduction+=.12;
      if(actor.id==='1315'&&actor.s.eidolon>=1)reduction+=.16;
      if(actor.id==='1317'&&actor.s.eidolon>=1&&actor.ink>0)reduction+=.15;
      if(enemy.anaxaDefUntil>enemy.turn)reduction+=.16;
      if(actor.id==='1014'&&actor.s.eidolon>=2)reduction+=Math.min(15,actor.resonanceEarned||0)*.01;
      if(actor.id==='1015'&&actor.s.eidolon>=6&&kind==='skill')reduction+=.2;
      if(actor.id==='1221'&&actor.s.eidolon>=2&&(kind==='followup'||kind==='ultimate'))reduction+=.2;
      if(find('1222')?.s.eidolon>=1&&maxToughness&&enemy.toughness===0)reduction+=.2;
      if(enemy.mishaDefUntil>enemy.turn)reduction+=.16;
      if(enemy.exposed>enemy.turn)reduction+=params('1106','03')[1];
      if(enemy.swUltUntil>enemy.turn)reduction+=params('1006','03')[2];
      if(enemy.swDefUntil>enemy.turn)reduction+=params('1006','04')[1];
      if(enemy.swanDefUntil>enemy.turn)reduction+=params('1307','02')[3];
      if(enemy.fugueDefUntil>enemy.turn)reduction+=params('1225','02')[3];
      if(G?.has(actor,'108',4))reduction+=.2; // All training targets have Quantum weakness.
      if(G?.has(actor,'116',4)){
        const dots=dotKeys.filter(key=>enemy[key]?.expires>=enemy.turn).length;
        const breakDots=['Physical','Fire','Thunder','Wind'].filter(element=>enemy.breakStatuses?.[element]).length;
        reduction+=.06*Math.min(3,dots+breakDots);
      }
      if(G?.has(actor,'119',4)&&['break','break-dot','superbreak'].includes(kind)){
        const effect=breakValue(actor);
        if(effect>=1.5)reduction+=.1;
        if(kind==='superbreak'&&effect>=2.5)reduction+=.15;
      }
      return 100/(100+(scenario.enemyLevel+20)*Math.max(0,1-reduction));
    }
    function eidolonVulnerability(index){const d=dummies[index],dan=find('1414');return (d.dahliaVulnUntil>d.turn?.12:0)+(d.stitch&&find('1402')?.s.eidolon>=1?.15:0)+(dan?.s.eidolon>=6&&dan.bondmate?.length?.2:0);}
    function eidolonEnemyRes(index,element){
      const d=dummies[index],swan=find('1307'),hysi=find('1410'),types={Wind:'wind',Fire:'burn',Physical:'bleed',Thunder:'shock'};
      return (find('1405')?.s.eidolon>=2?.2:0)+(find('1321')?.s.eidolon>=2?.2:0)+(find('1506')?.s.eidolon>=6?.2:0)+(find('1504')?.s.eidolon>=6&&find('1504').ashBait?.length?.2:0)+(find('1507')?.s.eidolon>=1&&find('1507').rageUntil>now?.2:0)+(hysi?.s.eidolon>=4&&hysi.hysiUntil>hysi.turn?.2:0)
        +(swan?.s.eidolon>=1&&types[element]&&dotTypes(index).has(types[element])?.25:0);
    }
    function breakMultiplier(actor,index,dot=false){
      const d=dummies[index],s=stat(actor),ruan=find('1303'),trib=find('1403'),rappa=find('1317');
      const generic=sixthVulnerability(index)+eidolonVulnerability(index)+(d.firekissUntil>d.turn?d.firekiss*params('1210','04')[3]:0)+(d.weltVulnUntil>d.turn?.12:0)+(d.ashenBurn?.expires>=d.turn?.15+Math.max(0,(d.ashStacks||0)-1)*.05:0)+(d.hysiVulnUntil>d.turn?params('1410','02')[2]:0)+(trib?.tribZoneUntil>trib?.turn?.3:0)+(find('1406')?.4:0)+(d.lukaVulnUntil>d.turn?params('1111','03')[2]:0);
      const special=(d.befogUntil>d.turn?params('1222','03')[3]:0)+(d.besottedUntil>d.turn?params('1301','04')[0]:0)+(d.rappaVulnUntil>d.turn?(d.rappaVuln||0):0)+(actor.id==='1310'&&actor.combustionUntil>now?.2:0)+(actor.id==='1315'&&actor.duelUntil>actor.turn&&index===0?(actor.s.eidolon>=4?.42:.3):0)+(dot&&d.sampoVulnUntil>d.turn?params('1108','03')[1]:0)+(dot&&d.kafkaDotVulnUntil>d.turn?.3:0);
      const fugue=find('1225');
      return (1+breakValue(actor))*(fugue?.s.eidolon>=4&&hasFoxPrayer(actor,fugue)?1.2:1)*(1+clamp(s.resPen+eidolonEnemyRes(index,data.characters[actor.id].element)+(d.archerQuantumUntil>d.turn&&data.characters[actor.id].element==='Quantum'?.2:0)+(d.luochaResUntil>d.turn?.2:0)+(d.avenResUntil>d.turn?.12:0)+(d.pelaIceUntil>d.turn&&data.characters[actor.id].element==='Ice'?.12:0)+(d.swResUntil>d.turn?d.swResAmount||.1:0),0,1))*(1+generic+special)*(d.toughness>0?.9:1);
    }
    function breakDamage(actor,index,multiplier=1,element=data.characters[actor.id].element,label='Пробитие',cap=maxToughness){
      if(!maxToughness)return 0;const type={Physical:2,Fire:2,Wind:1.5,Thunder:1,Ice:1,Quantum:.5,Imaginary:.5}[element];
      return creditBreak(actor,index,breakBase*type*(.5+Math.min(maxToughness,cap)/40)*multiplier*breakMultiplier(actor,index),label,'break');
    }
    function creditBreak(actor,index,damage,label,kind){damage*=defenseMultiplier(actor,index,kind);if(aeon&&aha.acting)aha.instantDamage+=damage;actor.total+=damage;actor.breakDamage=(actor.breakDamage||0)+(kind==='superbreak'?0:damage);actor.superDamage=(actor.superDamage||0)+(kind==='superbreak'?damage:0);damageByTarget[index]+=damage;summerRecord(actor,damage);const cipher=find('1406');if(cipher&&!cipher.cipherUlting){const speed=stat(cipher).speed;cipher.bank=(cipher.bank||0)+damage*(index===0?params(cipher.id,'04')[1]:.08)*(speed>=170?2:speed>=140?1.5:1)*(cipher.s.eidolon>=1?1.5:1);}record(actor,label+' · цель '+(index+1),damage,kind);const cy=find('1415');if(cy&&(cy.ripple||cy.cyreneZoneUntil>cy.turn))trueHit(actor,damage*cyreneTrueRatio(cy),[index],'Кирена · истинный урон пробития');return damage;}
    function onBreak(actor,index,exo=false){
      const d=dummies[index],element=data.characters[actor.id].element;d.breaks++;actor.breakCount=(actor.breakCount||0)+1;
      const hmc=find('8005'),fugue=find('1225'),rappa=find('1317'),mei=find('1303'),booth=find('1315'),himeko=find('1003');
      d.distance+=10000*(.25+(hmc?.3:0)+(fugue?.15:0));
      if(element==='Imaginary'){d.distance+=3000*(1+breakValue(actor));d.breakSlowUntil=d.turn+1;}
      if(['Physical','Fire','Wind','Thunder','Ice','Quantum'].includes(element)){d.breakStatuses??={};d.breakStatus={owner:actor.id,element,remaining:element==='Ice'||element==='Quantum'?1:2,stacks:1,action:actor.actionKey};d.breakStatuses[element]=d.breakStatus;if(element==='Quantum')d.distance+=2000*(1+breakValue(actor));}
      if(element==='Ice')d.breakFrozen=true;
      breakDamage(actor,index,1,element,exo?'Экзопробитие':'Пробитие');debuffApplied(actor,index);
      if(hmc)energy(hmc,10);
      if(rappa){rappa.rappaCharges=Math.min(rappa.s.eidolon>=6?15:10,(rappa.rappaCharges||0)+1);d.rappaVuln=.02+Math.min(.08,Math.max(0,stat(rappa).atk-2400)*.0001);d.rappaVulnUntil=d.turn+2;}
      if(fugue?.s.eidolon>=2)energy(fugue,3);
      if(fugue){const extra=.06+(breakValue(fugue)>=2.2?.12:0);for(const a of actors)if(a!==fugue){const before=a.buffs.find(b=>b.key==='fugueBreak')?.values.breakStacks||0;buff(a,fugue.id,'fugueBreak',{breakStacks:Math.min(2,before+1),breakEffect:Math.min(2,before+1)*extra},2);}}
      if(actor.id==='8001')actor.destroyStacks=Math.min(2,(actor.destroyStacks||0)+1);if(booth?.duelUntil>booth?.turn&&index===0){booth.pocket=Math.min(3,(booth.pocket||0)+1);if(booth.s.eidolon>=2&&booth.pocketE2Turn!==booth.turn){booth.pocketE2Turn=booth.turn;gainSP();buff(booth,booth.id,'boothE2',{breakEffect:.3},2);}booth.duelUntil=0;energy(booth,10);record(booth,'Карманное преимущество · '+booth.pocket);}
      if(mei){if(mei.s.eidolon>=4)buff(mei,mei.id,'meiE4',{breakEffect:1},3);breakDamage(mei,index,params('1303','04')[1]+(mei.s.eidolon>=6?2:0),'Ice','Талант Жуань Мэй');if(mei.meiUltUntil>mei.turn&&!d.rebloom&&!d.rebloomLock)d.rebloom={owner:mei.id};}
      if(himeko)himeko.himekoCharges=(himeko.himekoCharges||0)+1+(actor===himeko&&himeko.s.eidolon>=4&&actor.actionKind==='skill'?1:0);
      if(G?.has(actor,'111',4))energy(actor,3);
      const su=find('1206');if(su)sushangSpeed(su);
      if(actor.id==='1310'&&actor.fireflyEnhanced&&!exo&&actor.s.eidolon>=2&&actor.turn>=(actor.fireflyExtraReady||0)){actor.fireflyExtraReady=actor.turn+2;actor.distance=0;record(actor,'Светлячок E2 · дополнительный ход');}
    }
    function reduceToughness(actor,index,base,options={}){
      if(!maxToughness||base<=0)return;const d=dummies[index],amount=base*(efficiency(actor)+(options.memo&&find('1413')?.s.eidolon>=4?(actor.id==='1413'?.5:.25):0)),before=d.toughness;let actual=0,overflow=amount;
      if(before>0){actual=Math.min(before,amount);d.toughness=Math.max(0,before-amount);overflow=Math.max(0,amount-before);if(d.toughness<1e-8){d.toughness=0;d.exo=find('1225')?maxToughness*.4:0;onBreak(actor,index);}}
      if(d.toughness===0&&d.exo>0&&overflow>0){const spent=Math.min(d.exo,overflow);d.exo=Math.max(0,d.exo-overflow);actual+=spent;if(d.exo<1e-8){d.exo=0;onBreak(actor,index,true);}}
      actor.breakHits??={};const info=actor.breakHits[index]??={broken:0,all:0,rate:options.superRate};info.broken+=before===0?amount:overflow;info.all+=amount;if(options.superRate!==undefined)info.rate=options.superRate;
      if(actual>0){const x=find('1214');if(x&&!(actor===x&&options.followup)){if(actor===x)x.karma=(x.karma||0)+actual/10;else if(!actor.karmaTargets?.size){x.karma=(x.karma||0)+1;actor.karmaTargets??=new Set();actor.karmaTargets.add(index);}}}
      const entangle=d.breakStatuses?.Quantum;if(entangle&&entangle.action!==actor.actionKey){entangle.stacks=Math.min(5,entangle.stacks+1);entangle.action=actor.actionKey;}
      record(actor,'Стойкость · цель '+(index+1)+' · −'+actual.toFixed(2)+' → '+d.toughness.toFixed(2)+(d.exo?' / экзо '+d.exo.toFixed(2):''),0,'toughness');
    }
    function superBreak(actor){
      const hits=actor.breakHits||{};actor.breakHits={};if(!maxToughness)return;
      const h=find('8005'),f=find('1225'),dahlia=find('1321'),pre=dahlia?.dahliaUntil>dahlia?.turn,partner=dahlia&&(actor===dahlia||actor.id===dahlia.partner);
      for(const [key,hitsForTarget] of Object.entries(hits)){const i=Number(key),eligible=pre?hitsForTarget.all:hitsForTarget.broken,rates=[];
        if(h?.hmcUntil>h?.turn)rates.push(['Первопроходец',1+([.6,.5,.4,.3,.2][dummies.length-1])]);
        if(f)rates.push(['Фуга',1]);
        if(partner||dahlia?.s.eidolon>=1)rates.push(['Георгина',(hitsForTarget.rate||0)+.6+(partner&&dahlia.s.eidolon>=1?.4:0)]);
        if(actor.id==='1310'&&actor.combustionUntil>now){const be=breakValue(actor);if(be>=2)rates.push(['Светлячок',be>=3.6?.5:.35]);}
        if(actor.id==='1317'&&actor.ink>0)rates.push(['Раппа',.6]);
        for(const [source,rate] of rates)if(eligible>0)creditBreak(actor,i,breakBase*eligible/10*rate*breakMultiplier(actor,i),'Суперпробитие · '+source,'superbreak');
      }
    }
    function breakTick(index,multiplier=1,consume=true,onlyElement=null){const d=dummies[index];for(const b of Object.values(d.breakStatuses||{})){if(onlyElement&&b.element!==onlyElement)continue;if(!consume&&!['Physical','Fire','Wind','Thunder'].includes(b.element))continue;const a=find(b.owner);let base=0;
      if(b.element==='Physical')base=2*breakBase*(.5+maxToughness/40); // Infinite-HP bleed reaches its toughness cap.
      if(b.element==='Fire')base=breakBase;if(b.element==='Thunder')base=2*breakBase;if(b.element==='Wind')base=breakBase;
      if(b.element==='Ice')base=breakBase;if(b.element==='Quantum')base=.6*breakBase*(.5+maxToughness/40)*b.stacks;
      const dot=['Physical','Fire','Wind','Thunder'].includes(b.element);creditBreak(a,index,base*breakMultiplier(a,index,dot)*multiplier,(consume?'Эффект пробития':'Подрыв пробития')+' · '+b.element,dot?'break-dot':'break');if(dot){hysiExtra(index);arcanaAdd(index);}if(consume&&--b.remaining<=0){delete d.breakStatuses[b.element];if(d.breakStatus===b)d.breakStatus=null;}}
    }
    function dahliaBless(duration=3){const a=find('1321');if(!a)return;const be=.5+.24*breakValue(a);for(const ally of actors)if(ally!==a)buff(ally,a.id,'dahliaBE',{breakEffect:be},duration);record(a,'Георгина · командный эффект пробития');}
    function yukongAction(actor,key=actor.actionKey){const y=find('1207');if(y?.bow>0&&actor.yukongCredit!==key){actor.yukongCredit=key;energy(y,2);}}
    function gainSP(n=1){const actual=Math.min(n,maxSP-sp);sp=Math.min(maxSP,sp+n);rinSP(actual);const a=find('1015');if(a&&sp>=4){a.archerCritUntil=a.turn+1;record(a,'Страж · крит. урон +120%');}}
    function resonance(actor,n){actor.resonance=Math.min(99,(actor.resonance||0)+n);actor.resonanceEarned=(actor.resonanceEarned||0)+n;actor.resource=actor.resonance;}
    function drawTile(actor,n=1){actor.tiles??=[];for(let k=0;k<n;k++){actor.tiles.push(Math.floor(rng()*3));if(actor.tiles.length>4){const counts=[0,0,0];for(const t of actor.tiles)counts[t]++;const least=Math.min(...actor.tiles.map(t=>counts[t]));actor.tiles.splice(actor.tiles.findIndex(t=>counts[t]===least),1);}}actor.kong=actor.tiles.length===4&&actor.tiles.every(t=>t===actor.tiles[0]);}
    function coup(actor,cast,ownHooks=false){
      const c=find('1412');if(!c||c.merit!==actor.id||c.cCharge<6||copying||!['SingleAttack','Blast','AoE','Bounce'].includes(skill(actor.id,'02')?.effect))return;
      const costs=['energy','resource','syzygy','inspiration','ink','will','charges','pocket','squama','transmigration','bladeUntil','distance','answers','resonance','resonanceEarned','manaBurst','saberEnhanced','mydeiCharge'];
      const snapshot=Object.fromEntries(costs.map(k=>[k,actor[k]])),interpret=dummies.map(d=>d.interpret),old=actor.actionKind;c.coupActive=true;copying=actor;actor.peerageOriginal=true;beginAction(actor);actor.actionKind='skill';record(c,'Внезапная атака → '+data.characters[actor.id].name);
      cast();if(G&&!ownHooks&&!['1205','1405'].includes(actor.id))G.afterSkill(actor);
      for(const k of costs)actor[k]=snapshot[k];dummies.forEach((d,i)=>{d.interpret=interpret[i];});copying=null;c.coupActive=false;c.cCharge=Math.max(0,c.cCharge-6);if(c.ode==='cerydra')c.cCharge=Math.min(8,c.cCharge+1);c.resource=c.cCharge;actor.actionKind=old;beginAction(actor);
    }
    function cCharge(actor,n){if(actor.coupActive)return;actor.cCharge=Math.min(8,(actor.cCharge||0)+n);actor.resource=actor.cCharge;}
    function cerydraAction(actor,kind=actor.actionKind){const c=find('1412');if(c?.merit===actor.id&&['basic','skill'].includes(kind)&&actor.cerydraCredit!==actor.actionKey){actor.cerydraCredit=actor.actionKey;cCharge(c,1);energy(c,5);}}
    function memoSpeed(m){if(['1409','1415'].includes(m.owner.id))return 0;if(m.owner.id==='1512')return m.owner.fever?m.baseSpeed*(m.owner.s.eidolon>=4?1.2+m.owner.mood*.005:1):0;const base=m.owner.id==='1402'?m.baseSpeed:m.owner.id==='1413'?160:m.owner.id==='8007'?130:165;let speed=base+(m.owner.id==='1402'?data.character_skills['1140203'].params[m.owner.s.eidolon>=3?6:5][0]*m.stacks:0);for(const b of m.owner.buffs)if(['astaUlt','ruanSpeed','phainonEnd'].includes(b.key)&&b.expires>m.owner.turn)speed+=(b.values.speed||0)+base*(b.values.speedPct||0);return Math.max(1,speed);}
    function memoStat(m){const r=stat(m.owner,false,true),h=find('1409'),mem=find('8007');if(mem?.s.eidolon>=1&&m.owner.buffs.some(b=>b.key==='memSupport'))r.crit+=.1;r.hp=m.baseHP+(m.owner.id!=='1407'&&h?.rainUntil>h?.turn?m.baseHP*(h.s.eidolon>=1?.8:.3)+600:0);r.speed=memoSpeed(m);if(m.owner.id==='1415')r.hp=m.baseHP*1.24;
      if(G?.has(m.owner,'127',4)&&m.owner.eq.saver)r.hp+=m.baseHP*.24;for(const b of m.unit.buffs)if(b.expires>=m.unit.turn){r.hp+=m.baseHP*(b.values.hp||0)+(b.values.flatHP||0);r.critDamage+=b.values.critDamage||0;r.damage+=b.values.damage||0;}if(m.owner.id==='1413')r.crit+=0;
      if(m.owner.id==='1409'){r.damage+=(m.icaStacks||0)*.8;if(stat(m.owner).speed>200)r.hp+=m.baseHP*.2;}return r;}
    function livingAllies(){return [...actors.filter(a=>!form.active||a.id==='1408'),...memories.filter(m=>m.active&&!form.active&&!['1407','1415'].includes(m.owner.id)).map(m=>m.unit)];}
    function memoHot(m){const hot=m.unit.lynxHot;if(!hot)return;const a=find(hot.owner);if(hot.expires>=m.unit.turn)heal(m.unit,stat(a).hp*.036+96,a);if(hot.expires<=m.unit.turn)m.unit.lynxHot=null;}
    function spawnMemory(id){const m=memo(id),a=m.owner;if(m.active)return m;m.active=true;a.memoryActive=true;m.unit.turn=0;m.unit.buffs=[];m.turn=0;m.distance=id==='1409'?Infinity:0;
      const base=a.s.hp+a.s.baseHP*(a.eq?.p.HPAddedRatio||0);m.baseHP=id==='1402'?base*.66+720:id==='1407'?34000:id==='8007'?base*.8+640:id==='1415'?base:id==='1512'?base*.7:base*.5;m.unit.currentHP=memoStat(m).hp;
      if(id==='1402')m.baseSpeed=(a.s.speed+a.s.baseSpeed*(a.eq?.p.SpeedAddedRatio||0))*.35;
      if(id==='1407'){m.breath=0;for(const ally of actors)buff(ally,id,'netherRoar',{damage:.1},3);}
      if(id==='1409'){m.tally??=0;energy(a,m.everSummoned?15:45);m.everSummoned=true;}
      if(id==='1512'){m.baseSpeed=stat(a).speed*1.8;energy(a,20);a.birds=Math.min(3,(a.birds||0)+1);}
      if(id==='8007'){m.charge=.5+(m.everSummoned?0:.4);m.everSummoned=true;}
      record(a,'Призыв · '+m.name);return m;
    }
    function memoHit(m,coefficient,targets,label,options={}){return hit(m.owner,coefficient,targets,m.name+' · '+label,{...options,kind:'memo',memo:m,statSnapshot:memoStat(m)});}
    function castGain(amount){const a=find('1407'),m=memo('1407');if(!a||form.active)return;if(m.active)m.unit.currentHP=Math.min(34000,m.unit.currentHP+amount);else a.resource=Math.min(a.ode==='castorice'?102000:34000,a.resource+amount);}
    function recordHealing(target,healer,value){finalHealing(target,healer);
      const c=find('1407');if(c&&!form.active&&target!==memo('1407').unit){c.healCaps??=new Map();const key=target._memo?'m'+target.id:target.id,before=c.healCaps.get(key)||0,converted=Math.min(Math.max(0,4080-before),value);c.healCaps.set(key,before+converted);castGain(converted);}
      if(healer.id==='1409'){const m=memo('1409');if(m?.active){m.tally+=value*(find('1409')?.odeSky>0?1.72:1);m.icaStacks=Math.min(3,(m.icaStacks||0)+1);m.icaBuffUntil=m.unit.turn+2;}}
    }
    function phainonSpeed(a){return a.s.baseSpeed*(a.s.eidolon>=1?.66:.6);}
    function phainonGain(n){const a=find('1408');if(a&&!form.active)a.resource=Math.min(a.s.eidolon>=6?Infinity:15,a.resource+n);}
    function phainonTarget(target,source,healing=false){if(target.id!=='1408'||target._memo||form.active||target===source)return;target.targeted??=new Set();const key=actionSerial+':'+source.id;if(!target.targeted.has(key)){target.targeted.add(key);phainonGain(1);buff(target,'1408','phainonAlly',{critDamage:.3},3);}if(healing&&target.healBoostTurn!==target.turn){target.healBoostTurn=target.turn;buff(target,'1408','phainonHealing',{damage:.45},4);}}
    function settleMemories(){if(form.active)return;const m=memo('1409');if(m?.active&&!m.acting&&(m.hurt?.size||0)){m.acting=true;const hurt=[...m.hurt];m.hurt.clear();const a=m.owner,p=data.character_skills['1140903'].params[a.s.eidolon>=5?6:5];for(const target of hurt){if(!m.active)break;if(target._memo&&!target._memo.active)continue;m.unit.currentHP=Math.max(0,m.unit.currentHP-memoStat(m).hp*.04);heal(target,stat(a).hp*p[1]+p[2],m.unit);if(a.rainUntil>a.turn)for(const ally of livingAllies())if(ally!==m.unit)heal(ally,stat(a).hp*p[3]+p[4],m.unit);if(m.unit.currentHP<=0){m.active=false;a.memoryActive=false;a.distance=Math.max(0,a.distance-3000);record(a,'Ика · исчезновение, продвижение 30%');}}m.acting=false;}}
    function icaTurn(){const m=memo('1409');if(!m?.active||m.acting||form.active)return;const a=m.owner;m.acting=true;beginAction(a);m.unit.turn++;m.turn++;memoHot(m);const amount=(m.tally||0)*data.character_skills['1140901'].params[a.s.eidolon>=3?6:5][0];memoHit(m,0,allTargets(),'Тучи прочь!',{baseDamage:amount,toughness:10});m.tally*=a.s.eidolon>=6?.88:.5;energy(a,5);afterAttack(a,false,'memo');if(m.icaBuffUntil<=m.unit.turn)m.icaStacks=0;m.acting=false;}
    function endNetherwing(){const m=memo('1407');if(!m?.active)return;const a=m.owner;const p=data.character_skills['1140706'].params[a.s.eidolon>=3?6:5],s=memoStat(m);for(let n=0;n<6+(a.s.eidolon>=6?3:0);n++)hit(a,0,[Math.floor(rng()*dummies.length)],'Крылья Смерти · завершение',{kind:'memo',memo:m,statSnapshot:s,baseDamage:stat(a).hp*(p[0]+(m.odeEndBonus||0)),toughness:5,bonus:(m.turnBreaths||0)*.3});m.active=false;a.memoryActive=false;for(const ally of livingAllies())heal(ally,stat(a).hp*p[2]+p[3],a);record(a,'Крылья Смерти · исчезновение');}
    function memoryTurn(m){if(!m.active||form.active)return;const a=m.owner;beginAction(a);m.acting=true;m.turn++;m.unit.turn++;memoHot(m);m.distance=10000;
      if(a.id==='1402'){const p=data.character_skills['1140201'].params[a.s.eidolon>=5?6:5];memoHit(m,p[0],[0],'Колючая ловушка',{toughness:10});if(dummies.length>1)memoHit(m,p[1],allTargets().slice(1,3),'соседние цели',{toughness:5});energy(a,10);if(dummies[0].stitch)m.stacks=Math.min(a.s.eidolon>=4?7:6,m.stacks+1);afterAttack(a,false,'memo');}
      if(a.id==='1407'){m.turnBreaths=0;const p=data.character_skills['1140702'].params[a.s.eidolon>=5?6:5];for(let n=0;n<4&&m.active;n++){m.turnBreaths++;const cost=m.burningWill>0?0:8500;if(m.burningWill>0)m.burningWill--;const finish=m.unit.currentHP<=cost+1e-8;m.unit.currentHP=Math.max(1,m.unit.currentHP-cost);const c=[p[1],p[2],p[3]][Math.min(2,m.breath++)];memoHit(m,0,allTargets(),'дыхание '+m.breath,{baseDamage:stat(a).hp*c,toughness:10,bonus:Math.min(6,m.turnBreaths)*.3});if(finish)endNetherwing();}if(m.active&&m.turn>=3)endNetherwing();afterAttack(a,false,'memo');}
      sixthMemoryTurn(m);finalMemoryTurn(m);m.acting=false;if(a.id==='1413'&&m.active&&a.resource>=16)m.distance=0;settleMemories();
    }
    // Final roster batch. Queued reactions prevent energy/SP feedback from
    // recursively interrupting a damage packet or consuming the wrong action.
    const heirs=new Set(['1402','1403','1404','1405','1406','1407','1408','1409','1410','1412','1413','1414','1415']);
    const companions=new Set(['1001','1002','1003','1004','1224','1213','1413','1414','1313','8001','8003','8005','8007','8009']);
    function finalStats(a,s,forMemo){
      const c=find('1415'),n=find('1510'),av=find('1513');
      if(c){s.damage+=.2+(c.s.speed>=180?.2:0);if(a.id==='1415'){if(c.ripple)s.crit+=.5;if(memo(c.id)?.active)s.hp+=a.s.baseHP*.24;s.resPen+=Math.min(60,Math.max(0,c.s.speed-180))*.02;}}
      if(a.id==='1505'){s.crit+=.3;if(a.s.eidolon>=1)s.resPen+=.2;if(a.s.eidolon>=2)s.critDamage+=.36;}
      if(a.id==='1506'){const extra=Math.max(0,(a.resource||0)-Math.max(0,1-s.crit)/.004);s.crit+=Math.min(a.resource||0,Math.max(0,1-s.crit)/.004)*.004;s.critDamage+=extra*.008;}
      if(a.id==='1513')s.critDamage+=.48;
      if(n){if(n.navUntil>n.turn)s.damage+=.2;if(n.protocol==='decimation')s.critDamage+=1;if(a===n){s.resPen+=.2;s.critDamage+=.8;if(n.protocol==='verdict')s.damage+=1;}}
      if(find('1512')?.s.eidolon>=2)s.resPen+=.18;
      if(a.id==='1513'&&a.s.eidolon>=1)s.resPen+=.24;
      if(a.id==='1512'){s.crit+=.5;if(a.fever)s.damage+=.6+(a.mood||0)*.02;}
      if(a.ode==='cipher')s.damage+=.36;
      if(a.ode==='hysilens')s.damage+=1.2;
      if(a.ode==='aglaea'&&a.supremeUntil>now)s.damage+=.72;
      if(a.ode==='trailblazer'){const demi=memo('1415');if(demi?.active){s.atk+=demi.baseHP*1.24*.16;s.crit+=(find('1415').s.crit+(find('1415').ripple?.5:0))*.72;}}
      if(find('1412')?.ode==='cerydra'&&find('1412').merit===a.id)s.critDamage+=.3;
      const dh=find('1414');if(dh?.odeEarth>0&&dh.odeEarthUntil>dh.turn&&dh.bondmate===a.id)s.damage+=.24;
      if(a.id==='1408'&&a.ode==='phainon'&&form.active){s.crit+=.16;s.critDamage+=a.odeFlameCD||0;}
    }
    function finalVulnerability(){const r=find('1512'),e=find('1505');return (r?.birds>0?[0,.08,.12,.16][r.birds]:0)+(e?.foxVulnUntil>e?.turn?.12:0);}
    function finalElation(a,s){let v=0;if(a.id==='1505')v+=s.critDamage*.2;if(a.id==='1506'&&s.speed>=160)v+=.5+Math.min(100,s.speed-160)*.02;if(a.id==='1513'&&s.speed>=140)v+=.3+Math.min(200,s.speed-140)*.01;const av=find('1513');if(av&&elationActors.length>1)v+=.2+(a===av?.8:0);return v;}
    function queueFinal(kind,a,extra={}){finalQueue.push({kind,a,...extra});}
    let settlingFinal=false;
    function settleFinal(){if(settlingFinal||form.active)return;settlingFinal=true;let guard=0;try{while(finalQueue.length&&guard++<500){const e=finalQueue.shift();if(e.kind==='acheronEX')acheronEX(e.a);if(e.kind==='imbibitorEX')imbibitorEX(e.a);if(e.kind==='fox')foxAttack(e.a);if(e.kind==='wave')waveAttack(e.a,20,false);if(e.kind==='box')wolfBox(e.a,e.forced);if(e.kind==='demi')demiTurn(e.a,e.attack);if(e.kind==='nova')novaAssist(e.a,e.a,true);if(e.kind==='godslayer'){const a=e.a,before=a.mydeiCharge;a.mydeiActing=true;buff(a,a.id,'odeGodslayer',{critDamage:2},1);batchSkill(a,true);a.mydeiCharge=before;a.mydeiActing=false;a.buffs=a.buffs.filter(b=>b.key!=='odeGodslayer');}}if(guard>=500)throw Error('Слишком много реакций новых моделей.');}finally{settlingFinal=false;}}
    function evanEnergy(a,value,fromBanger=false){if(value<=0||copying===a)return;a.energy=Math.min(480,a.energy+value);a.foxEnergy=(a.foxEnergy||0)+Math.min(240,value);if(!fromBanger)addBanger(a,Math.min(100,value)*(a.s.eidolon>=2?2:1),true);while(a.foxEnergy>=240){a.foxEnergy-=240;queueFinal('fox',a);}}
    function evanElation(a,points){const p=elationParams(a);elationHit(a,p[1],allTargets(),'Эванесса · Мрачный разрыв',points,{toughness:10,ahaSkill:true});addBanger(a,p[0]+(a.s.eidolon>=1?10:0));}
    function foxAttack(a){beginAction(a);a.actionKind='followup';a.followups++;a.foxVulnUntil=a.turn+3;debuffApplied(a);hit(a,1,allTargets(),'Учитель Лиса · бонус-атака',{followup:true,toughness:10});if(banger(a)>0)elationHit(a,.25,allTargets(),'Учитель Лиса · Радость',banger(a),{kind:'additional'});energy(a,10);if(a.s.eidolon>=1)evanElation(a,banger(a));afterAttack(a,false,'followup');}
    function wolfGain(a,n){a.resource=Math.min(300,(a.resource||0)+n);if(a.godmode&&a.s.eidolon>=2){const count=Math.floor(a.resource/120);if(count>(a.wolfExtraCount||0)){a.wolfExtraCount=count;a.distance=0;a.godBasics=Math.max(-1,a.godBasics-1);record(a,'Волк 999 E2 · дополнительный ход');}}}
    function wolfSpend(){const a=find('1506');if(a?.godmode&&banger(a)>0&&rng()<(a.boxChance??1)){a.boxChance=(a.boxChance??1)*.2;queueFinal('box',a);}}
    function wolfBox(a,forced=false){if(!a.godmode||(!forced&&banger(a)<=0))return;const amount=elationHit(a,params(a.id,'03')[2]/dummies.length,allTargets(),'Волк 999 · коробочка',banger(a),{kind:'additional'}),choice=scenario.wolfBoxGift||'cycle';a.boxCounter=(a.boxCounter||0)+1;const gift=choice==='cycle'?['sword','sp','punchline'][(a.boxCounter-1)%3]:choice;
      if(gift==='sword')trueHit(a,amount*.2,[0],'Коробочка · меч');if(gift==='sp')gainSP(2);if(gift==='punchline')punch(3);record(a,'Коробочка · '+({sword:'Меч',sp:'Возврат SP',punchline:'Юмор'}[gift]));}
    function waveFervor(a,n){const before=a.fervor||0;a.fervor=Math.min(a.s.eidolon>=2?50:30,before+n);a.resource=a.fervor;if(a.s.eidolon>=1){for(let i=Math.floor(before/10);i<Math.floor(a.fervor/10);i++)queueFinal('wave',a);if(a.fervor>=10)a.wavePrimed=true;}else if(a.fervor>=10&&!a.wavePrimed){a.wavePrimed=true;queueFinal('wave',a);}}
    function waveAttack(a,points,enhanced){const previous=a.waveActing;a.waveActing=true;beginAction(a);const solo=elationActors.length===1;if(solo){a.followups++;if(G)G.followupStart(a);}const p=data.character_skills[a.id+(enhanced?'21':'20')].params[9+(a.s.eidolon>=3?1:0)+(a.s.eidolon>=5?1:0)],opt={kind:solo?'followup':'elation',followup:solo,group:solo,toughness:0,ahaSkill:aha.acting};elationHit(a,p[0],allTargets(),enhanced?'Прибой · Ставлю всё!':'Прибой · Поднимем бокалы!',points,opt);for(let n=0;n<p[enhanced?2:1];n++)elationHit(a,p[enhanced?3:2],[Math.floor(rng()*dummies.length)],'Прибой · отскок',points,opt);if(enhanced){const count=a.fervor||0;if(a.s.eidolon<6||aha.acting){a.fervor=0;a.resource=0;a.wavePrimed=false;}for(let n=0;n<count;n++)elationHit(a,p[1],[Math.floor(rng()*dummies.length)],'Прибой · расход Пыла',points,opt);}if(solo&&G)G.followupEnd(a,actors);afterAttack(a,false,solo?'followup':'elation');a.waveActing=previous;}
    function finalElationSkill(a,points){
      if(a.id==='1505')evanElation(a,points);
      if(a.id==='1506'){if(a.godmode){for(let n=0;n<6;n++)elationHit(a,data.character_skills['150621'].params[9+(a.s.eidolon>=3?1:0)+(a.s.eidolon>=5?1:0)][0],[Math.floor(rng()*dummies.length)],'Волк 999 · Демонстрация урона',points+(a.s.eidolon>=4?aha.punchline*5:0),{toughness:10/6,ahaSkill:true});a.boxChance=1;}else{wolfGain(a,15);record(a,'Волк 999 · Ход от профи');}if(points>=20)wolfGain(a,20);if(points>=40)wolfGain(a,20);return a.godmode?'attack':'noAttack';}
      if(a.id==='1513'){a.waveAhaSkills=(a.waveAhaSkills||0)+1;waveAttack(a,points,a.wavePrimed||a.s.eidolon>=6&&a.waveAhaSkills>2);if(a.s.eidolon>=2)waveFervor(a,4);return 'noAttack';}
    }
    function expireBangers(a){const e=find('1505');const gone=(a.bangers||[]).filter(b=>b.expires<=a.turn).reduce((n,b)=>n+b.value,0);if(e&&e!==a&&gone>0)addBanger(e,gone*.5);a.bangers=(a.bangers||[]).filter(b=>b.expires>a.turn);}
    function cyreneGain(n,source=null){const c=find('1415');if(!c)return;c.resource=Math.min((c.ripple?12:24)+27,c.resource+n);if(source&&source.id!=='1415'){c.demiSources??=new Set();c.demiSources.add(source.id);}}
    function futureReset(){const c=find('1415');if(!c)return;for(const a of actors)if(a!==c)a.future=true;for(const m of memories)if(m.active)m.future=true;}
    function futureAction(a,kind){const c=find('1415');if(!c||a===c)return;const unit=kind==='memo'?memo(a.id):a;if(unit?.future&&unit.futureActionKey!==a.actionKey){unit.futureActionKey=a.actionKey;if(kind!=='memo')unit.future=false;cyreneGain(1,kind==='memo'?{id:'memo:'+a.id}:a);}}
    function demiHistory(c){const m=memo(c.id);if(!m?.active)return;m.history=(m.history||0)+1;if(m.history>=3){m.history-=3;queueFinal('demi',c,{attack:true});}}
    function demiTurn(c,attack=false){const m=memo('1415');if(!m?.active)return;beginAction(c);m.turn++;m.unit.turn++;let usedAttack=false;const target=focusFor(c),eligible=[target,...actors.filter(a=>a!==target&&a!==c)].find(a=>!a.ode&&(heirs.has(a.id)||a.id==='8007'));
      if(!attack&&eligible){applyOde(c,eligible);record(c,'Демиург · ода → '+data.characters[eligible.id].name);}else if(!attack&&!heirs.has(target.id)&&target.id!=='8007'){buff(target,c.id,'cyreneOde',{damage:.4},2);const tm=memo(target.id);if(tm?.active)buff(tm.unit,c.id,'cyreneOde',{damage:.4},2);record(c,'Демиург · поэзия → '+data.characters[target.id].name);}else{usedAttack=true;memoHit(m,0,allTargets(),'Танец цветов и стрел',{baseDamage:memoStat(m).hp*data.character_skills['1141501'].params[c.s.eidolon>=3?6:5][0],toughness:0});const n=(c.demiSources?.size||0)+(c.s.eidolon>=1?12:0),multiplier=data.character_skills['1141501'].params[c.s.eidolon>=3?6:5][0]+(c.s.eidolon>=4?.06*Math.min(24,c.demiDances||0):0);for(let i=0;i<n;i++)memoHit(m,0,[Math.floor(rng()*dummies.length)],'Стрела воспоминания',{baseDamage:memoStat(m).hp*multiplier,toughness:0});c.demiDances=(c.demiDances||0)+1;if(c.s.eidolon>=1)cyreneGain(6);if(c.s.eidolon>=6){if(c.demiDances===1)c.demiE6Defense=true;else for(const ally of actors)ally.distance=Math.max(0,ally.distance-2400);}afterAttack(c,false,'memo');}
      if(!usedAttack){const e=find('1413');if(e){everGain(1);energy(e,5);}}const hy=find('1409');if(hy)hy.odeSky=2;const dh=find('1414');if(dh){dh.odeEarth=3;dh.odeEarthUntil=dh.turn+2;}
    }
    function applyOde(c,a){const id=a.id;a.ode=({'8007':'trailblazer','1402':'aglaea','1403':'tribbie','1404':'mydei','1405':'anaxa','1406':'cipher','1407':'castorice','1408':'phainon','1409':'hyacine','1410':'hysilens','1412':'cerydra','1413':'evernight','1414':'dhpt'})[id]||'generic';
      if(id==='1402'){const m=memo(id);if(m)m.stacks=6;a.romantic=true;}
      if(id==='1404'){if(a.vendetta){a.odeGodslayer=true;queueFinal('godslayer',a);}else a.distance=0;}
      if(id==='1405'){gainSP();a.distance=0;a.odeAnaxaHits=3;a.odeAnaxaReady=true;}
      if(id==='1409'){energy(a,24);a.odeSky=2;}
      if(id==='1408'){phainonGain(6);a.odeFlameCD=Math.min(.72,Math.max(0,a.resource-12)*.12);}
      if(id==='1410'){a.odeHysiEnergy=true;}
      if(id==='1414'){dragon.distance=0;dragon.enhanced=Math.max(1,dragon.enhanced);a.odeEarth=3;}
    }
    function mood(a,n,source=null){if(!a)return;const action=turnOwner?turnOwner.id+':'+turnOwner.turn:'event:'+eventSerial;if(a.s.eidolon>=2&&source&&source!==a&&a.moodE2Action!==action){a.moodE2Action=action;n+=2;}a.mood=Math.min(a.s.eidolon>=2?70:50,(a.mood||0)+n);a.resource=a.mood;const m=memo(a.id);if(m?.active){const count=a.mood>=12?3:a.mood>=6?2:1;if(count>(a.birds||1)){energy(a,20*(count-a.birds));a.birds=count;}if(count===3&&!a.fever){a.fever=true;if(a.s.eidolon>=4){a.mood+=12;a.resource=a.mood;}summerEnergy(a);a.summerDistance=10000;m.distance=0;record(a,'Раж · Музыканты выходят на сцену');}}
      if(source&&source!==a){const s=stat(source),r=stat(a);if(s.atk>r.atk)buff(source,a.id,'summerGift',{flatAtk:r.hp*(.16+(a.mood||0)*.004)},2);else buff(source,a.id,'summerGift',{critDamage:.4+(a.mood||0)*.015},2);}
      const key=turnOwner?turnOwner.id+':'+turnOwner.turn:'event:'+eventSerial;if(a.rhythmKey!==key&&a.rhythm>0){a.rhythmKey=key;a.rhythm--;energy(a,3/stat(a).energyRegen);}}
    function summerRecord(actor,damage){const a=find('1512');if(a?.s.eidolon>=1&&actor!==a&&memo('1512').active)a.summerBank=(a.summerBank||0)+damage;}
    function summerEnergy(a){if(a.s.eidolon>=6&&!a.summerEnergyUsed){a.summerEnergyUsed=true;energy(a,140/stat(a).energyRegen);}}
    function summerTick(a){summerEnergy(a);a.summerDistance=10000;a.mood=Math.max(0,a.mood-Math.max(12,a.mood*.5));a.resource=a.mood;record(a,'Раж · отсчёт, Настроение '+a.mood);if(a.mood===0){const m=memo(a.id);m.active=false;m.unit.currentHP=0;a.memoryActive=false;a.fever=false;a.summerBank=0;a.birds=0;a.distance=Math.max(0,a.distance-5000);record(a,'Музыканты · исчезновение');}}
    function finalMemoryTurn(m){if(m.owner.id==='1512'&&m.owner.fever){memoHit(m,0,allTargets(),'Щебечущий квартет',{baseDamage:memoStat(m).hp*(1.5+data.character_skills['1151201'].params[m.owner.s.eidolon>=5?6:5][1]-data.character_skills['1151201'].params[5][1]+(m.owner.s.eidolon>=6?1:0)),toughness:10});const a=m.owner;if(a.s.eidolon>=1&&(a.summerBank||0)>0){trueHit(a,a.summerBank*(.11+a.mood*.001),[0],'Зарянка: Яснопея E1 · записанный урон');a.summerBank*=.5;}afterAttack(a,false,'memo');}}
    function syncDemiHP(){const c=find('1415'),m=memo('1415');if(c&&m?.active)m.unit.currentHP=memoStat(m).hp*c.currentHP/stat(c).hp;}
    function finalHealing(target,healer){if(aeon&&target===aeon&&healer!==aeon&&!aeon.wishFromSustain){aeon.wishFromSustain=true;wishpower(1);}const r=find('1512');if(!r||healer.id===r.id)return;if(target.id===r.id)r.rhythm=Math.min(12,(r.rhythm||0)+12);const key=turnOwner?turnOwner.id+':'+turnOwner.turn:'event:'+eventSerial;if(r.healMoodKey!==key){r.healMoodKey=key;mood(r,1,healer._memo?.owner||healer);}}
    function novaAssist(n,user,extra=false){if(n.novaActing||form.active)return;const old=n.actionKind;n.novaActing=true;beginAction(n);n.actionKind='skill';if(G)G.beforeSkill(n);if(!extra){n.novaUsed=true;energy(n,18);if(user!==n)energy(user,4);if(user!==n&&companions.has(user.id)){n.protocol=['1001','1003','1004','1224','1413'].includes(user.id)?'decimation':'verdict';record(n,'Совместный протокол · '+(n.protocol==='verdict'?'Вердикт':'Уничтожение'));}}
      const p=params(n.id,'22'),bonus=n.s.eidolon>=6&&user!==n?.75:0;if(n.s.eidolon>=6&&user!==n)n.novaSource=Math.min(6,(n.novaSource||0)+1);if(n.s.eidolon>=4)for(const ally of actors)buff(ally,n.id,'novaE4',{resPen:ally===n?.3:.2},2);hit(n,user===n?p[3]:p[0],allTargets(),'Звездопроходец · поддержка',{toughness:10,bonus});for(let i=0;i<(user===n?p[4]:p[1])+(n.s.eidolon>=1?1:0);i++)hit(n,user===n?p[5]:p[2],[Math.floor(rng()*dummies.length)],'Звездопроходец · отскок',{toughness:2,bonus});afterAttack(n,false,'skill');if(G)G.afterSkill(n);n.novaActing=false;n.actionKind=old;}
    function novaAllyAssist(a){const n=find('1510');if(!n||n===a||n.assistUses<=0||a.departed||scenario.novaAssistPolicy==='off')return false;const crew=companions.has(a.id);if(!crew&&scenario.novaAssistPolicy!=='all')return false;n.assistUses--;novaAssist(n,a);if(crew||n.s.eidolon>=2){record(a,'Поддержка · дополнительное действие компаньона');beginAction(a);return false;}a.turn++;a.normal++;a.distance=10000;record(a,'Действие заменено навыком поддержки');return true;}
    function novaTrigger(n){if(n.novaActing||n.novaProcs>=2+(n.s.eidolon>=1?1:0))return;n.novaProcs++;queueFinal('nova',n);}
    function finalAfterAttack(a,targets,kind,isUltimate,wasFollow){
      if(kind==='memo')futureAction(a,kind);
      const av=find('1513');if(av&&a!==av&&!av.waveActing){punch(1);waveFervor(av,1);if(elationActors.length===1){addBanger(av,2);punch(1);av.soloAhaBoost=(av.soloAhaBoost||0)+25;}}waveAction(a,kind);
      const r=find('1512');if(r){mood(r,1,a);if(a.buffs.some(b=>b.key==='summerGuest'&&b.expires>=a.turn))mood(r,2,a);}
      if(a.ode==='aglaea'&&a.romantic){a.romantic=false;energy(a,70);}if(a.ode==='hysilens'&&a.odeHysiEnergy){a.odeHysiEnergy=false;energy(a,60);}if(a.ode==='hysilens'&&['basic','skill'].includes(kind))detonate(targets,kind==='skill'?.8:.6);
      if(a.ode==='trailblazer'&&kind==='basic'&&a.epic!==undefined&&a.actionKey!==a.odeMemKey){a.odeMemKey=a.actionKey;queueFinal('demi',find('1415'),{attack:true});}
      const n=find('1510');if(n&&n!==a&&n.protocol==='decimation'&&!n.novaActing){n.novaCount=(n.novaCount||0)+targets.length;const limit=n.s.eidolon>=1?6:9;if(n.novaCount>=limit){n.novaCount-=limit;novaTrigger(n);}}
    }
    function waveAction(a,kind){const av=find('1513');if(!av||a===av||!['basic','skill','ultimate','followup'].includes(kind)||av.waveCredits>=6||a.waveCredit===a.actionKey)return;a.waveCredit=a.actionKey;av.waveCredits=(av.waveCredits||0)+1;for(const b of actors)buff(b,av.id,'waveCD',{critDamage:.48},3);waveFervor(av,2);}
    function finalAction(a){futureAction(a,a.actionKind);waveAction(a,a.actionKind);if(a.id==='1415')futureReset();}
    function finalStartTurn(a){if(a.odeAnaxaUntil<=a.turn)a.odeAnaxaHits=0;if(a.id==='1510'){if(a.assistUses===1)energy(a,5);if(a.navUntil>a.turn)a.assistUses=a.s.eidolon>=2?Math.min(2,a.assistUses+1):1;}if(a.id==='1506'&&a.godmode)a.actionKind='basic';}
    function finalAfterUlt(a){const n=find('1510');if(n&&n!==a&&n.protocol==='verdict'){n.novaUltCount=(n.novaUltCount||0)+1;if(n.novaUltCount>=(n.s.eidolon>=1?1:2)){n.novaUltCount=0;novaTrigger(n);}}if(a.id==='1415')demiHistory(a);if(a.id==='1409'&&a.odeSky>0)a.odeSky--;}
    function finalRegular(a){const id=a.id;if(!['1415','1505','1506','1510','1512','1513'].includes(id))return false;const all=allTargets(),adj=all.slice(1,3);let use=a.s.policy!=='basic'&&sp>0;
      if(id==='1415'&&a.ripple)use=false;
      if(id==='1512')use=use&&(a.s.policy==='skill'||!memo(id).active||a.mood<12);
      if(id==='1510'){if(a.s.policy!=='basic'&&!(a.navUntil>a.turn)&&sp>0){a.actionKind='skill';spendSP();energy(a,30);a.navUntil=a.turn+3;a.assistUses=a.s.eidolon>=2?2:1;record(a,'Навигационный сигнал · поддержка восстановлена');return true;}if(a.s.policy!=='basic'){novaAssist(a,a);return true;}use=false;}
      if(id==='1506'&&a.godmode){wolfEnhanced(a);return true;}
      a.actionKind=use?'skill':'basic';if(use){spendSP();if(G)G.beforeSkill(a);
        if(id==='1415'){cyreneGain(3);a.cyreneZoneUntil=a.turn+2;record(a,'Цвети, рай будущего · зона');}
        if(id==='1505'){energy(a,30);punch(10);hit(a,params(id,'02')[1],[0],'Эванесса · Дисциплина',{toughness:20});if(adj.length)hit(a,params(id,'02')[2],adj,'Эванесса · соседние цели',{toughness:10});if(banger(a)>0)elationHit(a,.16,all.slice(0,3),'Эванесса · хит навыка');afterAttack(a);}
        if(id==='1506'){punch(5);hit(a,params(id,'02')[0],all,'Волк 999 · Буст стрельбы',{toughness:10});if(banger(a)>0)elationHit(a,.4,all,'Волк 999 · хит навыка');afterAttack(a);}
        if(id==='1512'){const had=memo(id).active,m=spawnMemory(id);if(had){heal(m.unit,memoStat(m).hp,a);mood(a,6,a);}record(a,'Музыканты · призыв / восстановление');}
        if(id==='1513'){const p=params(id,'02');a.waveCredits=0;if(a.s.eidolon>=4)for(const ally of actors)buff(ally,id,'waveE4',{},3);energy(a,30);punch(p[1]);waveFervor(a,p[2]);hit(a,p[0],all,'Прибой · Смертельный удар',{toughness:10});if(banger(a)>0)elationHit(a,params(id,'04')[1],all,'Прибой · хит навыка');afterAttack(a);}
        if(G)G.afterSkill(a);
      }else{const enhanced=id==='1415'&&a.ripple;if(!enhanced)gainSP();if(!['1415','1506'].includes(id))energy(a,20);
        if(id==='1415'){cyreneGain(enhanced?3:1);hit(a,0,[0],enhanced?'Навстречу любви и завтрашнему дню':'Кирена · базовая',{baseDamage:stat(a).hp*(enhanced?.3:.5),toughness:enhanced?5:10});if(enhanced)hit(a,0,all,'Кирена · волна будущего',{baseDamage:stat(a).hp*.3,toughness:5});}
        else if(id==='1512')hit(a,0,[0],'Яснопея · базовая',{baseDamage:stat(a).hp*.5,toughness:10});
        else{hit(a,1,[0],'Базовая атака',{toughness:10});if(id==='1506'&&banger(a)>0)elationHit(a,.4,[0],'Волк 999 · хит базовой');}afterAttack(a,false,'basic');if(G)G.afterBasic(a);
      }return true;
    }
    function wolfEnhanced(a){a.actionKind='basic';const scale=data.character_skills['150608'].params[a.s.eidolon>=3?6:5],base=data.character_skills['150608'].params[5],mult=1+.15*Math.min(2,Math.floor(a.resource/60));for(let n=0;n<100;n++){const i=Math.floor(rng()*dummies.length);if(banger(a)>0)elationHit(a,2.4/100*(scale[0]/base[0]),[i],'Волк 999 · отскок '+(n+1),banger(a),{kind:'basic',toughness:.1,originalMultiplier:mult});else hit(a,2.4/100*mult*(scale[0]/base[0]),[i],'Волк 999 · отскок '+(n+1),{toughness:.1});if([32,65,98].includes(n))wolfBox(a,true);}if(banger(a)>0)elationHit(a,scale[3]/base[3]/dummies.length,allTargets(),'Волк 999 · последний удар',banger(a),{kind:'basic',originalMultiplier:mult});else hit(a,mult*scale[3]/base[3]/dummies.length,allTargets(),'Волк 999 · последний удар',{toughness:0});afterAttack(a,false,'basic');a.godBasics++;if(a.godBasics>=3){a.godmode=false;a.resource=a.s.eidolon>=1?a.resource*.2:0;record(a,'Непобедимый игрок · окончание');}if(G)G.afterBasic(a);}
    function novaUltimate(a){a.novaProcs=0;const p=params(a.id,'03');let source=3+(a.novaSource||0);a.novaSource=0;function pulse(){if(a.s.eidolon>=6&&source>=6)hit(a,1.6,allTargets(),'Химеко Нова E6 · импульс',{kind:'additional',ultimate:true,toughness:0});hit(a,p[2],allTargets(),'Звездопроходец · орбитальный импульс',{toughness:1});for(let n=0;n<source;n++)hit(a,source>=3?.6:.3,[Math.floor(rng()*dummies.length)],'Орбитальный импульс · отскок',{toughness:0});source=0;}
      pulse();for(let i=0;i<6;i++){hit(a,p[0],allTargets(),'Звездопроходец · луч '+(i+1),{toughness:2});source+=a.s.eidolon>=6?2:1;if(source>=(a.s.eidolon>=6?6:3))pulse();}for(let n=0;n<3;n++)hit(a,p[6],[Math.floor(rng()*dummies.length)],'Звездопроходец · Последний удар',{toughness:1});afterAttack(a,true);}
    function finalUlt(a){const id=a.id,all=allTargets();
      if(id==='1415'){if(!a.ripple){a.resource=Math.max(0,a.resource-24);a.ripple=true;a.cyreneZoneUntil=Infinity;const old=stat(a).hp,m=spawnMemory(id);a.currentHP+=Math.max(0,stat(a).hp-old);m.unit.currentHP=memoStat(m).hp;m.history=1;for(const ally of actors)if(ally!==a){if(a.s.eidolon>=6)ally.distance=0;if(ally.id==='1220')ally.resource=Math.max(6,ally.resource);else if(ally.id==='1308')ally.resource=Math.max(9,ally.resource);else if(ally.id==='1407')ally.resource=Math.max(34000,ally.resource);else if(ally.id==='1408')ally.resource=Math.max(12,ally.resource);else if(ally.id==='1506')wolfGain(ally,Math.max(0,60-ally.resource));else ally.energy=Math.max(ally.energy,data.characters[ally.id].max_sp);}record(a,'Рябь прошлого · ульты команды активированы');}else a.resource=Math.max(0,a.resource-12);queueFinal('demi',a);return true;}
      if(id==='1506'){a.resource=Math.max(0,a.resource-60);a.godmode=true;a.godBasics=0;a.wolfExtraCount=0;if(a.s.eidolon>=2)for(const b of a.buffs)b.expires++;a.boxChance=1;wolfGain(a,20);a.distance=0;record(a,'Непобедимый игрок · 3 усиленные базовые');return true;}
      if(id==='1505'){const p=params(id,'03');if(a.s.eidolon>=6&&(a.ults-1)%4===0)energy(a,120/stat(a).energyRegen);hit(a,p[0],all,'Эванесса · Песнь меча',{toughness:20});const extra=all.length===1?4:all.length===2?2:1;for(let n=0;n<p[1]+extra;n++)hit(a,p[2],[Math.floor(rng()*all.length)],'Эванесса · отскок ульты',{toughness:5/(5+extra)});if(banger(a)>0){const points=Math.max(480,banger(a));elationHit(a,.24,all,'Эванесса · Радость ульты',points);for(let n=0;n<5+extra;n++)elationHit(a,.28,[Math.floor(rng()*all.length)],'Эванесса · отскок Радости ульты',points);}afterAttack(a,true);return true;}
      if(id==='1510'){novaUltimate(a);return true;}
      if(id==='1512'){const target=focusFor(a);if(target===a)return true;target.distance=0;const p=params(id,'03');energy(target,data.characters[target.id].max_sp*p[2]/stat(target).energyRegen);buff(target,id,'summerGuest',{},p[1]);assist(target,a);record(a,'Особый гость → '+data.characters[target.id].name);return true;}
      if(id==='1513'){const p=params(id,'03');punch(p[2]);waveFervor(a,p[1]);buff(a,id,'waveSpeed',{speedPct:p[3]},p[4]);hit(a,p[0],all,'Прибой · Победа над волнами',{toughness:20});if(banger(a)>0)elationHit(a,params(id,'04')[2],all,'Прибой · хит ульты');afterAttack(a,true);return true;}return false;
    }
    function finalInit(){const c=find('1415');if(c){const count=actors.filter(a=>a!==c&&(heirs.has(a.id)||data.characters[a.id].path==='Memory')).length;c.resource=[0,2,3,6][Math.min(3,count)]+(c.s.eidolon>=2?12:0);futureReset();}const n=find('1510');if(n){n.assistUses=1;n.novaProcs=0;}const av=find('1513');if(av){av.fervor=0;av.waveCredits=0;}const r=find('1512');if(r){r.mood=0;r.rhythm=0;r.birds=0;}}
    // Sixth batch: all state remains local to this simulation, including Aha.
    function sheetCD(a){return a.s.critDamage+a.buffs.reduce((n,b)=>n+(b.values.critDamage||0),0)+(G?.modifiers(a,actors,data).critDamage||0);}
    function sixthStats(a,r,forMemo){
      const ash=find('1504'),gil=find('1509'),rin=find('1508'),ever=find('1413'),mem=memo('8007'),mb=find('1507');
      if(ash)r.critDamage+=.4;
      if(gil){const extra=Math.min(1,Math.max(0,(data.characters[a.id].max_sp||0)-140)*.01);r.atk+=a.s.baseAtk*(.2+extra);r.critDamage+=.2+extra;}
      if(rin&&['1508','1015'].includes(a.id)&&!forMemo){r.atk+=a.s.baseAtk*1.5;r.resPen+=.15;}
      if(a.id==='1509'){r.speed+=a.s.baseSpeed*(a.enthusiasm||0)*.1;r.critDamage+=Math.min(6,a.enthusiasmEarned||0)*.25;}
      const yao=find('1502'),pearl=find('1503'),sparxie=find('1501');
      if(a.id==='1502')r.critDamage+=.6;
      if(yao?.s.eidolon>=2&&yao.yaoZoneUntil>yao.turn)r.speed+=a.s.baseSpeed*.12;
      if(pearl?.s.eidolon>=6&&pearl.pearlLearn>0)r.resPen+=.2;
      if(sparxie?.s.eidolon>=1)r.resPen+=Math.min(.15,aha.punchline*.015);
      if(a===sparxie&&a.s.eidolon>=6)r.resPen+=.2;
      if(a.id==='1508'&&a.s.eidolon>=6)r.resPen+=.2;
      if(gil?.s.eidolon>=6)r.resPen+=.2;
      if(a===gil){if(a.s.eidolon>=4)r.energyRegen+=.2;if(a.s.eidolon>=1&&a.buffs.some(b=>b.key==='kingBurden'))r.atk+=a.s.baseAtk*.6;}
      if(a.id==='1504'&&a.s.eidolon>=6)r.damage+=.04*Math.min(30,a.gluttonyEarned||0);
      if(a.id==='1510'&&a.s.eidolon>=6)r.resPen+=.2;
      if(find('1501'))r.critDamage+=Math.min(.8,aha.punchline*.08);
      if(ever){if(a.id==='1413'){r.crit+=.35;if(memo('1413')?.active)r.damage+=.5;if(ever.darkActive)r.damage+=.6;}
        if(forMemo&&ever.everSkillUntil>ever.turn){const count=actors.filter(b=>data.characters[b.id].path==='Memory').length;r.critDamage+=sheetCD(ever)*(.24+(ever.ode==='evernight'?.12:0))+[0,.05,.15,.5,.65][Math.min(4,count)];}}
      if(mem?.active)r.critDamage+=sheetCD(mem.owner)*.12+.24;
      if(mb?.rageUntil>now){r.damage+=.5+(mb.s.eidolon>=4?.5:0);if(actors.some(b=>b!==mb&&data.characters[b.id].path==='Warlock')){if(a.actionKind==='ultimate')r.damage+=.75;}else if(a===mb)r.damage+=.75;}
      if(a.id==='1507'&&a.rageUntil>now){r.crit+=.2;r.critDamage+=.6;}
    }
    function sixthVulnerability(index=0){const e=find('1413'),m=find('1507'),d=dummies[index];return (e?.darkActive?.3:0)+(find('1504')?.s.eidolon>=1?.24:0)+(find('1506')?.s.eidolon>=1&&find('1506').godmode?.2:0)+(m?.rageUntil>now?.5:0)+(d.yaoVulnUntil>d.turn?.16:0)+(d.rinVulnUntil>d.turn?.2:0)+(d.tbE4Until>d.turn?.1:0)+finalVulnerability();}
    function elation(a,withoutZone=false){const s=stat(a),eq=a.eq?.p||{};let v=(a.s.elation||0)+(eq.ElationDamageAddedRatioBase||0)+a.buffs.reduce((n,b)=>n+(b.values.elation||0),0);
      if(a.id==='1501')v+=Math.min(.8,Math.max(0,s.atk-2000)*.0005);
      if(a.id==='1502'&&s.speed>=120)v+=.3+Math.min(200,s.speed-120)*.01;
      if(a.id==='1503'&&s.def>=2400)v+=.32+Math.min(3600,s.def-2400)*.0003;
      if(a===aeon)v+=s.speed>=150?1.5:s.speed>=125?1.2:0;
      if(aeon?.emanator===a.id)v+=aeon.s.eidolon>=5?.22:.2;
      v+=finalElation(a,s);const y=find('1502');if(!withoutZone&&y?.yaoZoneUntil>y?.turn)v+=elation(y,true)*.2+(y.s.eidolon>=2?.16:0);if(find('1503')?.s.eidolon>=1)v+=[0,0,.1,.2,.6][Math.min(4,elationActors.length)];return v;
    }
    function banger(a){return (a.bangers||[]).filter(b=>b.expires>=a.turn).reduce((n,b)=>n+b.value,0);}
    function addBanger(a,n,fromEnergy=false){if(a.id==='1505'&&!fromEnergy)evanEnergy(a,n,true);a.bangers??=[];a.bangers.push({value:n,expires:a.id==='1503'?Infinity:a.turn+(['1502','1513'].includes(a.id)||a.id==='1505'&&a.s.eidolon>=6?3:2)});if(a.id==='1503'){let excess=banger(a)-(facesActive()?75:50);for(const b of a.bangers){const d=Math.min(excess,b.value);if(d>0){b.value-=d;excess-=d;}}}}
    function punch(n){aha.punchline+=n;if(aeon&&aha.punchline>=40&&!aeon.humorTriggered){aeon.humorTriggered=true;wishpower(1);for(const ally of actors)buff(ally,aeon.id,'aeonHumor',{critDamage:aeon.s.eidolon>=5?.44:.4},3);}const wolf=find('1506');if(wolf)wolfGain(wolf,n);record(null,'Юмор +'+n);}
    function ahaSpeed(){return (aeon?.s.baseSpeed??80)+(find('1513')?.soloAhaBoost||0)+elationActors.map(a=>stat(a).speed).sort((a,b)=>b-a).reduce((n,s,i)=>n+s/(5*2**i),0);}
    function wishpower(amount){
      aeon.resource=Math.min(10,aeon.resource+amount);
    }
    const facesActive=()=>aeon&&aeon.facesUntil>aeon.turn;
    function aeonRegular(a){
      if(a.s.policy!=='basic'&&sp>0&&actors.length>1&&(a.s.policy==='skill'||!a.emanator)){
        const target=core!==a?core:actors.find(ally=>ally!==a&&data.characters[ally.id].path==='Elation')||actors.find(ally=>ally!==a);
        a.actionKind='skill';
        if(G)G.beforeSkill(a);
        spendSP();
        a.emanator=target.id;
        assist(target,a);
        record(a,'Эманатор Радости → '+data.characters[target.id].name);
        a.followups++;
        elationHit(a,a.s.eidolon>=5?.55:.5,allTargets(),'Эон Аха · бонус-атака',banger(a),{followup:true,kind:'followup',toughness:10});
        elationHit(a,.2,allTargets(),'Эон Аха · дополнительный урон Эманатора',banger(a),{kind:'additional',element:data.characters[target.id].element});
        gainSP();
        afterAttack(a,false,'skill');
        if(G)G.afterSkill(a);
      }else{
        a.actionKind='basic';
        gainSP();
        elationHit(a,a.s.eidolon>=3?.55:.5,[0],'Эон Аха · базовая атака',banger(a),{kind:'basic',toughness:10});
        afterAttack(a,false,'basic');
        if(G)G.afterBasic(a);
      }
      wishpower(1);
    }
    function aeonUlt(a){
      a.resource-=8;
      a.wishFromSustain=false;
      a.facesUntil=a.turn+3;
      aha.distance=Math.max(0,aha.distance-2000);
      if(a.s.eidolon>=6&&a.ults===1){aha.distance=0;punch(100);}
      elationHit(a,a.s.eidolon>=3?2.16:2,allTargets(),'Эон Аха · сверхспособность',banger(a),{kind:'ultimate',toughness:20});
      for(let n=0;n<5;n++)elationHit(a,a.s.eidolon>=3?.648:.6,[Math.floor(rng()*dummies.length)],'Эон Аха · отскок',banger(a),{kind:'ultimate',toughness:5});
      afterAttack(a,true);
    }
    function elationEidolonMultiplier(a,points,options){const yao=find('1502'),pearl=find('1503');return (1+(yao?.s.eidolon>=6?.25:0)+(pearl?.s.eidolon>=2?.15:0)+(a.id==='1505'&&a.s.eidolon>=6?.15+.02*Math.min(10,Math.floor(banger(a)/100)):0)+(a.id==='1506'&&a.s.eidolon>=6&&options.kind==='basic'?.5:0)+(a.id==='1513'&&a.s.eidolon>=6?.25:0))*(options.ahaSkill&&aha.yaoExtra&&yao?.s.eidolon>=4?1.5:1)*(options.ahaSkill&&pearl?.s.eidolon>=4?2:1);}
    function elationHit(a,coef,targets,label,points=banger(a),options={}){const s=stat(options.statsActor||a);if(a===aeon&&aeon.s.eidolon>=4)points+=actors.reduce((sum,ally)=>sum+(ally===aeon?0:banger(ally)),0);return hit(a,0,targets,label,{...options,elation:true,kind:options.kind||'elation',baseDamage:7535.107*coef*elationEidolonMultiplier(a,points,options)*(aeon?.s.eidolon>=1?1.15:1)*(options.originalMultiplier||1)*(1+(options.elationValue??elation(a)))*(1+5*points/(points+240)),toughness:options.toughness||0,statSnapshot:s});}
    function elationParams(a){return data.character_skills[a.id+'20'].params[9+(a.s.eidolon>=3?1:0)+(a.s.eidolon>=5?1:0)];}
    function elationSkill(a,points){beginAction(a);a.actionKind='elation';
      if(a.id==='1501'){
        const originalMultiplier=facesActive()?(aeon.s.eidolon>=2?2.2:1.5):1;
        const options={toughness:0,originalMultiplier,ahaSkill:true},p=elationParams(a);
        elationHit(a,p[1],allTargets(),'Искра · На бис!',points,options);
        for(let n=0;n<p[2]+(a.s.eidolon>=6?Math.min(40,Math.floor(points)):0);n++)elationHit(a,p[0],[Math.floor(rng()*dummies.length)],'Искра · отскок Радости',points,options);
        a.thrill=(a.thrill||0)+2;
      }
      if(a.id==='1502'){for(const d of dummies)d.yaoVulnUntil=d.turn+3;debuffApplied(a);const p=elationParams(a),scale=a.s.eidolon>=6?2:1;elationHit(a,p[0]*scale,allTargets(),'Яо Гуан · огни счастья',points,{toughness:10,ahaSkill:true});for(let n=0;n<p[4];n++)elationHit(a,p[5]*scale,[Math.floor(rng()*dummies.length)],'Яо Гуан · отскок Радости',points,{toughness:2,ahaSkill:true});gainSP();}
      if(a.id==='1503'){const c=elationParams(a)[Math.max(0,Math.min(4,elationActors.length)-1)]*(aha.yaoExtra&&find('1502')?.s.eidolon>=4?1.5:1)*(a.s.eidolon>=4?2:1);for(const ally of actors)ally.pearlNext={points,coefficient:c};record(a,'Жемчуг · следующий удар команды');}
      if(a.id==='8009'){const p=data.character_skills['800920'].params[9+(a.s.eidolon>=3?1:0)+(a.s.eidolon>=5?1:0)];if(a.s.eidolon>=4){for(const d of dummies)d.tbE4Until=d.turn+2;debuffApplied(a);}if(a.s.eidolon>=6)buff(a,a.id,'elationTBE6',{critDamage:1},3);for(let n=0;n<p[0];n++)elationHit(a,p[1],[Math.floor(rng()*dummies.length)],'Первопроходец · отскок Радости',points,{toughness:2,ahaSkill:true});elationHit(a,p[2]/dummies.length,allTargets(),'Первопроходец · завершение Радости',points,{toughness:5,ahaSkill:true});}
      const finalHandled=finalElationSkill(a,points);if(!['1506','1513'].includes(a.id))energy(a,5);if(a.id!=='1503'&&finalHandled!=='noAttack')afterAttack(a,false,a.id==='1513'&&elationActors.length===1?'followup':'elation');
    }
    function ahaTurn(fixed){if(aha.acting||form.active)return;aha.acting=true;aha.count++;aha.instantDamage=0;const points=fixed??aha.punchline;record(null,'Аха · '+(fixed===undefined?'ход':'дополнительный ход')+' · Юмор '+points);
      for(const [order,a] of elationActors.entries()){
        if(a===aeon)continue;
        elationSkill(a,points+banger(a));addBanger(a,points);
        const ev=find('1505');if(ev&&elationActors.indexOf(ev)>order)addBanger(ev,points*(ev.s.eidolon>=2?.75:.5));
      }
      if(aeon){
        beginAction(aeon);aeon.actionKind='elation';
        elationHit(aeon,aeon.s.eidolon>=5?.66:aeon.s.eidolon>=3?.63:.6,allTargets(),'Эон Аха · навык Радости',points+banger(aeon),{toughness:10});
        trueHit(aeon,aha.instantDamage*(aeon.s.eidolon>=4?.25:.2),allTargets(),'Эон Аха · истинный урон Мига');
        addBanger(aeon,points);wishpower(1);afterAttack(aeon,false,'elation');
      }
      if(fixed===undefined)aha.punchline=Math.max(0,aha.punchline-points)+(facesActive()?points*.1:0);
      aha.acting=false;const sparxie=find('1501');if(sparxie?.s.eidolon>=1)punch(5);if(sparxie?.s.eidolon>=2){sparxie.distance=0;sparxie.thrill=(sparxie.thrill||0)+2;}
      if(aeon)aeon.humorTriggered=false;
      const av=find('1513');if(av)av.soloAhaBoost=0;settleFinal();
    }
    function memCharge(amount){const m=memo('8007');if(!m?.active)return;const old=m.charge||0;m.charge=Math.min(1,old+amount);if(old<1&&m.charge>=1)m.distance=0;}
    function everGain(n){const a=find('1413');if(!a)return;a.resource=Math.min(10000,a.resource+n+(a.s.eidolon>=2?2:0));const m=memo('1413');if(a.resource>=16&&m?.active&&!m.acting)m.distance=0;}
    function everAbility(a,own=true){if(a.id!=='1413')return;const unit=own?a:memo(a.id).unit;loseHP(unit,unit.currentHP*.05);buff(a,a.id,'everAbility',{critDamage:.15},2);if(own){everGain(1);energy(a,5);}}
    function sixthMemoryTurn(m){const a=m.owner;
      if(a.id==='1413'){
        everAbility(a,false);if(a.resource>=16){const charge=a.resource,p=data.character_skills['1141307'].params[a.s.eidolon>=5?6:5];a.resource=0;memoHit(m,0,[0],'Сон. Растворяется. Словно роса',{baseDamage:memoStat(m).hp*p[0]*charge,toughness:20});if(dummies.length>1)memoHit(m,0,allTargets().slice(1),'Роса · остальные цели',{baseDamage:memoStat(m).hp*p[1]*charge,toughness:10});loseHP(m.unit,m.unit.currentHP,true);m.active=false;a.memoryActive=false;m.unit.currentHP=0;buff(a,a.id,'everReturn',{speedPct:.1+.01*Math.min(40,charge)},1);gainSP();if(a.darkCharges>0)a.darkCharges--;if(a.s.eidolon>=6)everGain(charge*.3);}
        else{memoHit(m,0,[0],'Воспоминания. Кружатся. Дождём',{baseDamage:memoStat(m).hp*(.5+.1*Math.floor(a.resource/4)),toughness:10});everGain(1);}afterAttack(a,false,'memo');}
      if(a.id==='8007'){if(m.charge>=1){m.charge=0;const target=focusFor(a);buff(target,a.id,'memSupport',{crit:a.s.eidolon>=1?.1:0},3);target.memRatio=.28+Math.min(.2,Math.max(0,(data.characters[target.id].max_sp||0)-100)*.002);if(target!==a)target.distance=0;assist(target,a);record(a,'Мемо · Я! Помогу! → '+data.characters[target.id].name);energy(a,10);}else{const p=data.character_skills['1800701'].params[a.s.eidolon>=5?6:5];for(let n=0;n<p[1];n++)memoHit(m,.36*p[0]/.504,[Math.floor(rng()*dummies.length)],'Злодеи! Проблемы! · отскок',{toughness:1.25});memoHit(m,.9*p[2]/1.26,allTargets(),'Злодеи! Проблемы! · завершение',{toughness:10});memCharge(.05);energy(a,10);afterAttack(a,false,'memo');}}
      if(a.id==='8007'&&m.charge===0){futureAction(a,'memo');const e=find('1413');if(e){everGain(1);energy(e,5);}}
    }
    function rinSP(n){const a=find('1508');if(!a||n<=0)return;a.gems=Math.min(999,(a.gems||0)+n);if(activeActor&&!activeActor._memo){const stacks=activeActor===a&&a.s.eidolon>=4&&a.buffs.some(b=>b.key==='rinCD')?2:1;buff(activeActor,a.id,'rinCD',{critDamage:params(a.id,'04')[2]*stacks},2);}}
    function enthusiasm(n){const a=find('1509');if(!a)return;a.enthusiasm=(a.enthusiasm||0)+n;a.enthusiasmEarned=(a.enthusiasmEarned||0)+n;if(a.enthusiasm>=10)a.kingBurst=true;}
    function cyreneTrueRatio(c){return params(c.id,'02')[0]+(c.s.eidolon>=2?.06*Math.min(4,actors.filter(a=>a.ode||a.buffs.some(b=>b.key==='cyreneOde')).length):0);}
    function sixthTrue(a,damage,target,options){const c=find('1415');if(c&&(c.ripple||c.cyreneZoneUntil>c.turn))trueHit(a,damage*cyreneTrueRatio(c),[target],'Кирена · истинный урон');const mem=find('8007');if(options.memo&&!(mem?.s.eidolon>=1))return;if(a.buffs.some(b=>b.key==='memSupport'&&b.expires>=a.turn))trueHit(a,damage*((a.memRatio||.28)+(mem?.s.eidolon>=4&&data.characters[a.id].max_sp===0?.06:0)),[target],'Поддержка Мемо · истинный урон');}
    function ashGluttony(a,n){a.gluttony=Math.min(a.s.eidolon>=2?18:12,(a.gluttony||0)+n);a.gluttonyEarned=(a.gluttonyEarned||0)+n;}
    function ashFollow(a,enhanced=false){if(a.ashActing)return;a.ashActing=true;beginAction(a);a.followups++;if(!enhanced)a.ashCharge--;const extra=enhanced&&(a.gluttony||0)>=4;if(extra){a.gluttony-=4;if(a.s.eidolon>=2)ashGluttony(a,4*.35);}
      const bonus=.8+(a.gluttony||0)*.1,p=params(a.id,'04');hit(a,p[0],[0],enhanced?'Эшвейл · усиленная бонус-атака':'Эшвейл · бонус-атака',{followup:true,bonus,toughness:10});if(extra)hit(a,p[0],[0],'Эшвейл · Прожорливость',{followup:true,bonus,toughness:0});if(!enhanced)ashGluttony(a,2);a.resource=a.ashCharge;afterAttack(a,false,'followup');a.ashActing=false;}
    function mortSkill(a,followup=false){const p=params(a.id,'02');beginAction(a);a.actionKind=followup?'followup':'skill';loseHP(a,stat(a).hp*.1);if(followup)a.followups++;else energy(a,30);hit(a,0,allTargets(),'Мортенакс · Под клинком',{baseDamage:stat(a).hp*p[0],followup,group:followup,toughness:10});for(let n=0;n<4;n++)hit(a,0,[Math.floor(rng()*dummies.length)],'Мортенакс · отскок',{baseDamage:stat(a).hp*p[2],followup,group:followup,toughness:2.5});if(followup&&G)G.followupEnd(a,actors);afterAttack(a,false,followup?'followup':'skill');}
    function sixthAfterAttack(a,targets,kind,isUltimate,wasFollow){finalAfterAttack(a,targets,kind,isUltimate,wasFollow);
      if(kind==='memo'){const mem=find('8007');if(mem?.s.eidolon>=2&&mem!==a&&mem.memE2Turn!==mem.turn){mem.memE2Turn=mem.turn;energy(mem,8);}const e=find('1413');if(e){everGain(1);energy(e,5);}}
      const yao=find('1502');if(yao&&banger(yao)>0){const n=(a.actionSPSpent||0)>0?2:1;for(let k=0;k<n;k++)elationHit(a,.2,[targets[Math.floor(rng()*targets.length)]],'Великая удача',banger(yao),{kind:'additional',elationValue:Math.max(elation(a),elation(yao))});}
      if(a.pearlNext){const p=a.pearlNext;a.pearlNext=null;elationHit(a,p.coefficient,targets,'Жемчуг · дополнительный урон',p.points,{kind:'additional'});}
      const ash=find('1504');if(ash&&a!==ash&&targets.includes(0)){energy(ash,8);if(ash.ashCharge>0)ashFollow(ash);}
      const mb=find('1507');if(mb?.rageUntil>now&&!mb.mortActing){mb.mortCharge=(mb.mortCharge||0)+1;mb.resource=mb.mortCharge;const cap=mb.s.eidolon>=2?7:9;if(mb.mortCharge>=cap&&mb.currentHP>1){mb.mortCharge-=cap;if(mb.s.eidolon>=1)mb.rageUntil+=10000/70*.15;mb.mortActing=true;energy(mb,25);mortSkill(mb,true);mb.mortActing=false;}}
      const rin=find('1508');if(rin&&a.id==='1015'&&kind==='skill'&&!rin.rinJoint&&(sp<=3||(a.archerActiveUses||0)>=5)){rin.rinJoint=true;beginAction(rin);rin.followups++;hit(rin,3,allTargets(),'Свободный стиль Тосаки · Рин',{followup:true,toughness:10});afterAttack(rin,false,'followup');beginAction(a);a.followups++;hit(a,3,allTargets(),'Свободный стиль Тосаки · Арчер',{followup:true,toughness:10});gainSP(4);afterAttack(a,false,'followup');}
      const gil=find('1509'),saber=find('1014');if(gil&&saber&&['1509','1014'].includes(a.id)&&!gil.gilJoint){gil.jointCount=(gil.jointCount||0)+1;if(gil.jointCount>=8){gil.jointCount=0;gil.gilJoint=true;beginAction(gil);gil.followups++;hit(gil,4,allTargets(),'Королевский дуэт · Гильгамеш',{followup:true,toughness:10});afterAttack(gil,false,'followup');beginAction(saber);saber.followups++;hit(saber,6,allTargets(),'Королевский дуэт · Сэйбер',{followup:true,toughness:10});afterAttack(saber,false,'followup');enthusiasm(3);energy(saber,120/stat(saber).energyRegen);saber.kingUlt=true;gil.gilJoint=false;}}
    }
    function sixthAction(a){finalAction(a);if(find('8007')?.s.eidolon>=4&&data.characters[a.id].max_sp===0)memCharge(.03);const gil=find('1509');if(gil&&a!==gil)enthusiasm(1);}
    function sixthAfterUlt(a){finalAfterUlt(a);a.kingUltActive=false;const gil=find('1509');if(gil){if(a!==gil){if(gil.s.eidolon>=6)gil.goldenRule=Math.min(3,(gil.goldenRule||0)+1);enthusiasm(2);energy(gil,(a.id==='1014'?360:data.characters[a.id].max_sp)*.3/stat(gil).energyRegen);buff(gil,gil.id,'kingBurden',{},3);}else enthusiasm(gil.s.eidolon>=2?7:2);}}
    function sixthStartTurn(a){finalStartTurn(a);if(a.id==='1413'){a.buffs=a.buffs.filter(b=>b.key!=='everReturn');if(a.darkCharges===0)a.darkActive=false;}if(a.id==='1508')a.rinJoint=false;const p=find('1503');if(p&&a!==p)addBanger(p,5);a.bangers=(a.bangers||[]).filter(b=>b.expires>=a.turn);}
    function sixthRegular(a){const id=a.id;if(!['1413','8007','1501','1502','1503','8009','1504','1507','1508','1509'].includes(id))return false;const all=allTargets(),adj=all.slice(1,3),target=focusFor(a);let use=a.s.policy!=='basic'&&sp>0;
      if(id==='8007')use=use&&(a.s.policy==='skill'||!memo(id).active);
      if(id==='1502')use=use&&(a.s.policy==='skill'||!(a.yaoZoneUntil>a.turn));
      if(id==='1503')use=use&&(a.s.policy==='skill'||(!a.pearlLearn&&actors.some(b=>b.currentHP<stat(b).hp*.8)));
      if(id==='1507')use=a.s.policy!=='basic'&&a.rageUntil>now&&a.currentHP>1;
      if(id==='1509'){if(a.normal===1)use=false;else if(a.kingBurst)use=sp>0;}
      if(id==='1501')use=a.s.policy!=='basic'&&(sp>0||a.thrill>0);
      if(id==='1508'&&a.rinShadow>0&&a.s.policy!=='basic')use=true;
      a.actionKind=use?'skill':'basic';
      if(id==='1413')everAbility(a);
      if(id==='1507'&&use){if(G)G.beforeSkill(a);mortSkill(a);if(G)G.afterSkill(a);return true;}
      if(id==='1501'&&use){a.actionKind='basic';let n=0;while(n<20&&(sp>0||a.thrill>0)){if(a.thrill>0){a.thrill--;if(a.s.eidolon>=2){const stacks=Math.min(4,(a.buffs.find(b=>b.key==='sparxieE2')?.values.critDamage||0)*10+1);buff(a,id,'sparxieE2',{critDamage:stacks*.1},2);}spendSP('thrill');}else spendSP();n++;if(rng()<(scenario.sparxieRefundPercent??20)/100){punch(2);gainSP(2);}else punch(1);}gainSP();energy(a,40);hit(a,1+.2*n,[0],'Искра · стрим '+n+' интеракций',{toughness:10});if(adj.length)hit(a,.5+.1*n,adj,'Искра · стрим, соседние цели',{toughness:5});if(banger(a)>0){elationHit(a,.4,[0],'Искра · хит стрима');if(adj.length)elationHit(a,.2,adj,'Искра · хит соседних');for(let k=0;k<n;k++)elationHit(a,.2,[Math.floor(rng()*Math.min(3,all.length))],'Искра · хит интеракции');}afterAttack(a,false,'basic');if(G)G.afterBasic(a);return true;}
      if(use){if(G)G.beforeSkill(a);
        const rinShadow=id==='1508'?(a.rinShadow||0):0,rinEnhanced=id==='1508'&&(rinShadow>0||(a.gems||0)>=15||sp>=7);if(id!=='1508'||!rinEnhanced)spendSP();else if(!rinShadow)while(sp>2){spendSP();a.gems=Math.min(999,a.gems+2);}energy(a,30);
        if(id==='1413'){loseHP(a,a.currentHP*.1);const m=spawnMemory(id);heal(m.unit,memoStat(m).hp*.5,a);a.everSkillUntil=a.turn+2;everGain(2+(a.darkActive?12:0));record(a,'Так гаснет день · Мемория '+a.resource);}
        if(id==='8007'){const had=memo(id).active,m=spawnMemory(id);if(had){const p=params(id,'02');heal(m.unit,memoStat(m).hp*p[0],a);memCharge(p[1]);}record(a,'Я выбираю тебя!');}
        if(id==='1502'){a.yaoZoneUntil=a.turn+3;punch(3);record(a,'Свет десяти граней · зона');}
        if(id==='1503'){const p=params(id,'02');addBanger(a,p[0]);pearlHeal(a,p[1],p[2]);record(a,'Жемчуг · лечение');}
        if(id==='8009'){const p=params(id,'02');if(a.s.eidolon>=1)a.tbE1=Math.min(3,(a.tbE1||0)+1);addBanger(a,p[1]);hit(a,p[0],all,'Первопроходец · Пусть бушует буря',{toughness:10});if(banger(a)>0)elationHit(a,.3,all,'Первопроходец · хит навыка',Math.max(...actors.map(banger)));energy(a,10/stat(a).energyRegen);punch(3);afterAttack(a);}
        if(id==='1504'){ashGluttony(a,1);a.ashBait='active';hit(a,3+params(id,'02')[0]-2,[0],'Эшвейл · Приманка',{toughness:20});gainSP();afterAttack(a);}
        if(id==='1508'){const bonus=a.s.eidolon>=2?.3:0;if(rinEnhanced){const p=params(id,'09');let spent=0,available=rinShadow||a.gems;hit(a,p[0],all,'Рин · Эксперимент со Второй магией',{toughness:20,bonus});for(let n=0;n<33&&available>=3;n++){available-=3;spent+=3;hit(a,p[2],[Math.floor(rng()*all.length)],'Рин · отскок камня',{toughness:2,bonus});}if(rinShadow)a.rinShadow=0;else{a.gems=available;if(a.s.eidolon>=1&&spent>=30){a.rinShadow=spent;record(a,'Рин E1 · теневые камни');}}buff(a,id,'rinSpeed',{speedPct:.2},3);}else hit(a,params(id,'02')[0],[0],'Рин · Самоцветный меч',{toughness:20,bonus});afterAttack(a);}
        if(id==='1509'){const p=params(id,'02');if(a.s.eidolon>=1)energy(a,40);hit(a,p[0]+(a.s.eidolon>=2?1:0),[0],'Гильгамеш · Сокровища короля',{toughness:20});if(adj.length)hit(a,p[1]+(a.s.eidolon>=2?.5:0),adj,'Гильгамеш · соседние сокровища',{toughness:10});a.enthusiasm=0;afterAttack(a);}
        if(G)G.afterSkill(a);
      }else{const enhancedMem=id==='8007'&&a.epic>0&&memo(id).active,pearl=id==='1503'&&a.pearlLearn>0;if(!enhancedMem)gainSP();energy(a,id==='1502'?30:20);
        if(enhancedMem){a.epic--;hit(a,1.2,all,'Первопроходец · совместная базовая',{toughness:5});afterAttack(a,false,'basic');beginAction(a);memoHit(memo(id),1.2,all,'совместная базовая',{toughness:5});memCharge(.1);afterAttack(a,false,'memo');}
        else if(pearl){if(a.s.eidolon>=2){punch(2);addBanger(a,2);}a.pearlLearn--;hit(a,0,all,'Жемчуг · усиленная базовая',{baseDamage:stat(a).def,toughness:10});pearlHeal(a,.08,160);if(a.pearlModel&&data.characters[a.pearlModel].path==='Elation'){if(banger(a)>0)elationHit(a,.15,all,'Жемчуг · хит базовой');elationHit(a,.6,all,'Глубокое обучение',banger(find(a.pearlModel)),{elationValue:elation(find(a.pearlModel)),statsActor:find(a.pearlModel)});if(a.s.eidolon>=6)elationHit(a,2.4,all,'Жемчуг E6 · Радость образца',banger(find(a.pearlModel)),{elationValue:elation(find(a.pearlModel)),statsActor:find(a.pearlModel)});}afterAttack(a,false,'basic');}
        else {const hp=id==='1413'||id==='1507',def=id==='1503',co=params(id,'01')[0]||1;hit(a,hp||def?0:co,[0],'Базовая атака',{baseDamage:hp?stat(a).hp*(id==='1507'&&a.rageUntil>now?1:id==='1413'?co:.5):def?stat(a).def*.9:undefined,toughness:10});if(id==='1502'){if(adj.length)hit(a,.3,adj,'Яо Гуан · соседние цели',{toughness:5});punch(3);}if(id==='8009'){energy(a,10/stat(a).energyRegen);punch(3);}afterAttack(a,false,'basic');}
        if(G)G.afterBasic(a);
      }return true;
    }
    function pearlHeal(a,ratio,flat){const amount=stat(a).def*ratio+flat;for(const ally of livingAllies())heal(ally,amount,a);const low=[...livingAllies()].sort((x,y)=>x.currentHP/stat(x).hp-y.currentHP/stat(y).hp)[0];heal(low,amount,a);}
    function sixthUlt(a){const id=a.id,all=allTargets(),target=focusFor(a);
      if(id==='1413'){everAbility(a);const m=spawnMemory(id);memoHit(m,0,all,'Спи крепко, о бессонный мир',{baseDamage:memoStat(m).hp*params(id,'03')[0],toughness:20});afterAttack(a,true,'memo');a.darkCharges=a.s.eidolon>=2?4:2;a.darkActive=true;record(a,'Загадка тьмы · '+a.darkCharges+' заряда');}
      else if(id==='8007'){const m=spawnMemory(id);memCharge(.4);a.epic=Math.min(2,(a.epic||0)+1);memoHit(m,params(id,'03')[0],all,'Вместе, Мемо!',{toughness:20,guaranteedCrit:a.s.eidolon>=6});afterAttack(a,true,'memo');}
      else if(id==='1501'){const n=elationActors.length;punch(2+(n>=3?8:n===2?4:2)+(a.s.eidolon>=4?5:0));if(a.s.eidolon>=4)buff(a,id,'sparxieE4',{elation:.36},3);a.thrill=(a.thrill||0)+(n>=3?4:1);hit(a,params(id,'03')[1]+params(id,'03')[2]*elation(a),all,'Искра · Пока камера снимает',{toughness:20});if(banger(a)>0)elationHit(a,params(id,'04')[1],all,'Искра · хит ульты');afterAttack(a,true);}
      else if(id==='1502'){punch(5);for(const ally of actors)buff(ally,id,'yaoPen',{resPen:.2},3);aha.yaoExtra=true;ahaTurn(a.s.eidolon>=1?40:params(id,'03')[3]);aha.yaoExtra=false;}
      else if(id==='1503'){addBanger(a,params(id,'03')[2]);a.pearlLearn=3;a.pearlModel=target.id;target.distance=Math.max(0,target.distance-10000*([0,.1,.15,.3,1][Math.min(4,elationActors.length)]));if(a.s.eidolon>=2)for(const ally of elationActors)if(ally!==a&&ally!==target)ally.distance=Math.max(0,ally.distance-10000*([0,.1,.15,.3,1][Math.min(4,elationActors.length)]));assist(target,a);record(a,'Глубокое обучение → '+data.characters[target.id].name);if(data.characters[target.id].path==='Elation'){if(a.pearlRefund)energy(a,90/stat(a).energyRegen);a.pearlRefund=true;}}
      else if(id==='8009'){punch(5);if(a.tbE1){for(const ally of actors)addBanger(ally,a.tbE1*2);a.tbE1=0;}const p=params(id,'03');buff(target,id,'elationTB',{critDamage:p[0]},p[1]);if(a.s.eidolon>=2)buff(target,id,'elationTBE2',{elation:.12},2);assist(target,a);if(data.characters[target.id].path==='Elation'){addBanger(target,10);elationSkill(target,20+banger(target));}else target.distance=Math.max(0,target.distance-5000);}
      else if(id==='1504'){ashGluttony(a,2);a.ashBait='active';if(a.s.eidolon>=4)buff(a,id,'ashE4',{atk:.4},3);hit(a,params(id,'03')[0],[0],'Эшвейл · Пиршество',{toughness:30});afterAttack(a,true);ashFollow(a,true);a.ashCharge=3;a.resource=3;}
      else if(id==='1507'){if(a.rageUntil>now){hit(a,0,all,'Мортенакс · Закалка одного',{baseDamage:stat(a).hp*params(id,'14')[0]*(a.s.eidolon>=6?1.5:1),toughness:20});afterAttack(a,true);}else{a.rageUntil=now+10000/70;loseHP(a,stat(a).hp*.2);for(const i of all)debuffApplied(a,i);record(a,'Безмерная ярость · отсчёт SPD 70');}}
      else if(id==='1508'){const p=params(id,'03');a.gems=Math.min(999,(a.gems||0)+p[2]+(a.s.eidolon>=6?24:0));if(a.s.eidolon>=6)a.distance=0;for(const d of dummies)d.rinVulnUntil=d.turn+3;gainSP();hit(a,p[0],[0],'Рин · An Gal Ta Ki Gal Šè',{toughness:30});if(all.length>1)hit(a,p[1],all.slice(1),'Рин · остальные цели ульты',{toughness:20});debuffApplied(a);afterAttack(a,true);}
      else if(id==='1509'){const bonus=a.buffs.some(b=>b.key==='kingBurden')?.4:0,p=params(id,'03'),extraCritDamage=a.goldenRule||0;a.goldenRule=0;hit(a,p[0],all,'Гильгамеш · Энума Элиш',{bonus,toughness:20,extraCritDamage});for(let n=0;n<p[2];n++)hit(a,p[1]+(a.s.eidolon>=6?.8:0),[Math.floor(rng()*all.length)],'Гильгамеш · отскок Энума',{bonus,toughness:2,extraCritDamage});afterAttack(a,true);}
      else return false;return true;
    }
    function sixthInit(){if(find('1509')?.s.eidolon>=2)enthusiasm(5);const e=find('1413');if(e){e.resource=1;energy(e,70);spawnMemory(e.id);}const mem=find('8007');if(mem)mem.distance=Math.max(0,mem.distance-3000);const ash=find('1504');if(ash){ash.ashCharge=2;ash.resource=2;ash.gluttony=0;}const mb=find('1507');if(mb)mb.energy=Math.max(mb.energy,data.characters[mb.id].max_sp*.75);const rin=find('1508');if(rin){rin.gems=20;buff(rin,rin.id,'rinSpeed',{speedPct:.2},3);}}
    function fifthSkill(a){const id=a.id,p=params(id,'02'),target=focusFor(a),all=allTargets(),adj=all.slice(1,3);a.actionKind='skill';if(G)G.beforeSkill(a);energy(a,id==='1402'?20:30);
      if(id==='1402'){const had=memo(id).active,m=spawnMemory(id);heal(m.unit,memoStat(m).hp*.5,a);if(!had)a.distance=0;record(a,'Аглая · призыв/лечение Швеи');}
      else if(id==='1407'){const enhanced=memo(id).active;if(copying!==a)for(const ally of livingAllies())if(ally!==memo(id).unit)loseHP(ally,ally.currentHP*(enhanced?.4:.3));if(enhanced){if(a.castE2Ready&&!copying){a.castE2Ready=false;a.resource=Math.min(34000,a.resource+10200);record(a,'Кастория E2 · Новое цветение');}hit(a,0,all,'Костяной коготь · Кастория',{baseDamage:stat(a).hp*.3,toughness:10});afterAttack(a);const m=memo(id);if(m.active){beginAction(a);memoHit(m,0,all,'совместная атака',{baseDamage:stat(a).hp*.5,toughness:10});afterAttack(a,false,'memo');}}else{hit(a,0,[0],'Кастория · навык',{baseDamage:stat(a).hp*p[1],toughness:20});if(adj.length)hit(a,0,adj,'Кастория · соседние цели',{baseDamage:stat(a).hp*p[2],toughness:10});afterAttack(a);}}
      else if(id==='1409'){const m=spawnMemory(id);for(const ally of livingAllies())heal(ally,stat(a).hp*p[ally===m.unit?2:0]+p[ally===m.unit?3:1],a);record(a,'Гиацина · лечение навыком');settleMemories();if(a.rainUntil>a.turn)icaTurn();}
      else if(id==='1408'){if(!copying)phainonGain(2);hit(a,p[0],[0],'Фаенон · навык',{toughness:20});if(adj.length)hit(a,p[1],adj,'Фаенон · соседние цели',{toughness:10});afterAttack(a);}
      else if(id==='8001'){hit(a,p[0],[0],'Первопроходец · Похоронный хоум-ран',{toughness:20,bonus:.25});if(adj.length)hit(a,p[0],adj,'Первопроходец · соседние цели навыка',{toughness:10});afterAttack(a);}
      else if(id==='8003'){a.magma=Math.min(8,(a.magma||0)+1);for(const i of all)if(rng()<effectChance(a,1,i)){dummies[i].tauntUntil=dummies[i].turn+1;debuffApplied(a,i);}trailShield(a);record(a,'Вечно горящий янтарь');}
      else if(id==='1001'){const [ratio,duration,,flat]=params(id,'02');target.marchShield={amount:(stat(a).def*ratio+flat)*(G?.has(a,'103',4)?1.2:1),expires:target.turn+duration+1,skill:true};finalHealing(target,a);assist(target,a);phainonTarget(target,a,true);record(a,'Март 7 · щит → '+data.characters[target.id].name);}
      else if(id==='1008'){const [cost,damage]=params(id,'02');loseHP(a,stat(a).hp*cost);hit(a,damage,[0],'Арлан · навык без SP',{toughness:20,bonus:a.s.eidolon>=1&&a.currentHP<=stat(a).hp*.5?.1:0});afterAttack(a);}
      else if(id==='1110'){const old=stat(target).hp;const p=params(id,'02'),hp=stat(a).hp;buff(target,id,'survival',{flatHP:hp*(p[0]+(a.s.eidolon>=6?.06:0))+p[1],effectRes:a.s.eidolon>=6?.3:0},p[2]);if(a.s.eidolon>=4)buff(target,id,'lynxE4',{flatAtk:hp*.03},1);target.currentHP+=Math.max(0,stat(target).hp-old);heal(target,hp*p[3]+p[4],a);target.lynxHot={owner:id,expires:target.turn+3};assist(target,a);record(a,'Реакция выживания → '+data.characters[target.id].name);}
      else if(id==='1312'){a.mishaHits=Math.min(10,(a.mishaHits||3)+1);a.resource=a.mishaHits;const p=params(id,'02');if(a.mishaRefund){a.mishaRefund=false;gainSP();}hit(a,p[0],[0],'Миша · навык',{toughness:20});if(adj.length)hit(a,p[1],adj,'Миша · соседние цели',{toughness:10});afterAttack(a);}
    }
    function trailShield(a){const p=params(a.id,'04'),amount=(stat(a).def*(p[0]+(a.s.eidolon>=2?.02:0))+p[3]+(a.s.eidolon>=2?27:0))*(G?.has(a,'103',4)?1.2:1);for(const ally of actors){ally.trailShield={amount,expires:ally.turn+2};finalHealing(ally,a);phainonTarget(ally,a,true);}record(a,'Первопроходец · щит команды');}
    function aglaeaJointBonus(a,speed){return a.s.eidolon<6?0:speed>320?.6:speed>240?.3:speed>160?.1:0;}
    function fifthRegular(a){const id=a.id;if(!['1402','1407','1409','1408','8001','8003','1001','1008','1110','1312'].includes(id))return false;const target=focusFor(a);let use=a.s.policy!=='basic'&&(sp>0||['1407','1008'].includes(id));
      if(id==='1402')use=use&&!(a.supremeUntil>now)&&(a.s.policy==='skill'||!memo(id).active);
      if(id==='1409')use=use&&(a.s.policy==='skill'||!memo(id).active||a.rainUntil>a.turn||actors.some(b=>b.currentHP<stat(b).hp*.8));
      if(id==='1001')use=use&&(a.s.policy==='skill'||!(target.marchShield?.expires>target.turn));
      if(id==='1110')use=use&&(a.s.policy==='skill'||actors.some(b=>b.currentHP<stat(b).hp*.7));
      if(id==='8003')use=use&&a.s.policy==='skill';
      if(id==='8003'&&(a.trailShield?.expires>=a.turn)){energy(a,5);buff(a,id,'trailATK',{atk:.15},1);}
      if(use){if(!['1407','1008'].includes(id))spendSP();coup(a,()=>fifthSkill(a));fifthSkill(a);if(G)G.afterSkill(a);return true;}
      a.actionKind='basic';const ag=id==='1402'&&a.supremeUntil>now&&memo(id).active,fire=id==='8003'&&((a.magma||0)>=4||a.freeMagma);if(!ag)gainSP();energy(a,20);
      if(ag){const p=data.character_skills['140208'].params[a.s.eidolon>=3?6:5],bonus=aglaeaJointBonus(a,stat(a).speed);dummies[0].stitch=true;hit(a,p[0],[0],'Тысячекратный поцелуй · Аглая',{toughness:10,bonus});if(dummies.length>1)hit(a,p[1],allTargets().slice(1,3),'Аглая · соседние цели',{toughness:5,bonus});hit(a,.3,[0],'Связующая нить',{kind:'additional'});energy(a,10);afterAttack(a,false,'basic');beginAction(a);memoHit(memo(id),p[2],[0],'совместная базовая',{toughness:10,bonus:aglaeaJointBonus(a,memoSpeed(memo(id)))});if(dummies.length>1)memoHit(memo(id),p[3],allTargets().slice(1,3),'соседние цели',{toughness:5,bonus:aglaeaJointBonus(a,memoSpeed(memo(id)))});memo(id).stacks=Math.min(a.s.eidolon>=4?7:6,memo(id).stacks+1);afterAttack(a,false,'memo');}
      else{const hp=['1407','1409','1110'].includes(id),co=hp?.5:fire?data.character_skills['800308'].params[a.s.eidolon>=5?6:5][0]:['1001','1008','1312','8001','8003'].includes(id)?params(id,'01')[0]:1;hit(a,hp?0:co,[0],'Базовая атака',{baseDamage:hp?stat(a).hp*(id==='1110'?params(id,'01')[0]:.5):undefined,toughness:fire?20:10});if(id==='8003'&&a.s.eidolon>=1)hit(a,0,[0],'Первопроходец E1 · огненный урон',{kind:'additional',baseDamage:stat(a).def*(fire?.5:.25),toughness:0});if(fire){if(a.s.eidolon>=6)a.trailDefense=Math.min(3,(a.trailDefense||0)+1);if(!a.freeMagma)a.magma-=4;a.freeMagma=false;if(dummies.length>1)hit(a,data.character_skills['800308'].params[a.s.eidolon>=5?6:5][1],allTargets().slice(1,3),'Первопроходец · усиленная соседняя атака',{toughness:10});heal(a,stat(a).hp*.05);}else if(id==='8003')a.magma=Math.min(8,(a.magma||0)+1);if(id==='1402'&&memo(id).active){dummies[0].stitch=true;hit(a,.3,[0],'Связующая нить',{kind:'additional'});energy(a,10);}afterAttack(a,false,'basic');}
      if(id==='8003')trailShield(a);if(id==='1409'&&a.rainUntil>a.turn)icaTurn();if(G)G.afterBasic(a);return true;
    }
    function fifthUlt(a){const id=a.id,all=allTargets();
      if(id==='1402'){spawnMemory(id);memo(id).unit.currentHP=memoStat(memo(id)).hp;a.supremeUntil=now+100;a.distance=0;record(a,'Высшая форма · отсчёт SPD 100');}
      else if(id==='1407'){const overflow=Math.max(0,a.resource-34000)/34000*100;a.resource=0;const m=spawnMemory(id);if(a.s.eidolon>=2){m.burningWill=2;a.distance=0;a.castE2Ready=true;}if(a.ode==='castorice')m.odeEndBonus=.0024*overflow+(dummies.length<=2?.0048:0);record(a,'Новое цветение · Крылья Смерти');}
      else if(id==='1409'){const m=spawnMemory(id),old=livingAllies().map(b=>[b,stat(b).hp]);a.rainUntil=a.turn+3;for(const [b,hp] of old)b.currentHP+=Math.max(0,stat(b).hp-hp);for(const ally of livingAllies())heal(ally,stat(a).hp*params(id,'03')[ally===m.unit?5:0]+params(id,'03')[ally===m.unit?6:1],a);record(a,'После дождя · командный HP');settleMemories();icaTurn();}
      else if(id==='1408'){if(turnOwner&&turnOwner!==a)for(const b of turnOwner.buffs)b.expires++;const hp=stat(a).hp;a.resource-=12;a.phainonFormHP=0;if(a.ode==='phainon')a.odeFlameCD=Math.min(.72,Math.max(0,a.resource+12-12)*.12);form.active=true;form.turns=0;form.actions=0;form.extra=false;form.scourge=4;form.distance=0;a.phainonFormHP=hp*2.7;a.currentHP+=a.phainonFormHP;record(a,'Каослана · союзники покидают поле');}
      else if(id==='8001'){hit(a,params(id,'03')[all.length===1?0:1],[0],'Прорыв · основной удар',{toughness:30,bonus:all.length>1?.25:0});if(all.length>1)hit(a,params(id,'03')[2],all.slice(1,3),'Прорыв · соседние цели',{toughness:20});afterAttack(a,true);}
      else if(id==='8003'){const s=stat(a);hit(a,0,all,'Пылающее копьё',{baseDamage:s.atk*params(id,'03')[0]+s.def*params(id,'03')[1],toughness:20});if(a.s.eidolon>=6)a.trailDefense=Math.min(3,(a.trailDefense||0)+1);a.freeMagma=true;trailShield(a);afterAttack(a,true);}
      else if(id==='1001'){const [damage,chance,,freeze]=params(id,'03');hit(a,damage,all,'Ледниковый каскад',{toughness:20});for(const i of all)if(rng()<effectChance(a,chance+.15,i)){dummies[i].freeze={owner:id,coefficient:freeze};if(a.s.eidolon>=1)energy(a,6);debuffApplied(a,i);}afterAttack(a,true);}
      else if(id==='1008'){const [damage,adjacent]=params(id,'03'),boost=a.s.eidolon>=6&&a.currentHP<=stat(a).hp*.5;hit(a,damage,[0],'Арлан · ульта',{toughness:30,bonus:boost?.2:0});if(all.length>1)hit(a,boost?damage:adjacent,all.slice(1,3),'Арлан · соседние цели ульты',{toughness:20,bonus:boost?.2:0});afterAttack(a,true);}
      else if(id==='1110'){for(const ally of livingAllies()){heal(ally,stat(a).hp*params(id,'03')[1]+params(id,'03')[2],a);ally.lynxHot={owner:id,expires:ally.turn+3};phainonTarget(ally,a,true);}record(a,'Рысь · ульта и периодическое лечение');}
      else if(id==='1312'){const p=params(id,'03'),count=(a.mishaHits||3)+(a.s.eidolon>=1?Math.min(5,all.length):0);if(a.s.eidolon>=6){a.mishaRefund=true;buff(a,id,'mishaE6',{damage:.3},1);}buff(a,id,'mishaEHR',{effectHit:.6},1);for(let n=0;n<count;n++){const i=n?Math.floor(rng()*all.length):0;if(a.s.eidolon>=2&&rng()<effectChance(a,.24,i)){dummies[i].mishaDefUntil=dummies[i].turn+3;debuffApplied(a,i);}if(rng()<effectChance(a,n?p[2]:1,i)){dummies[i].freeze={owner:id,coefficient:p[3]};debuffApplied(a,i);}hit(a,p[1]+(a.s.eidolon>=4?.06:0),[i],'Миша · удар ульты '+(n+1),{toughness:n?5:10,extraCritDamage:dummies[i].freeze?.3:0});}a.buffs=a.buffs.filter(b=>b.key!=='mishaEHR');a.mishaHits=3;a.resource=3;afterAttack(a,true);}
      else return false;return true;
    }
    function phainonPowered(a,basic=false){a.actionKind=basic?'basic':'skill';if(basic){form.scourge=Math.min(7,form.scourge+2+(a.s.eidolon>=4?4:0));const p=data.character_skills['140808'].params[a.s.eidolon>=3?6:5];hit(a,p[0],[0],'Каослана · усиленная базовая',{toughness:30});if(dummies.length>1)hit(a,p[1],allTargets().slice(1,3),'Каослана · соседние цели',{toughness:20});}else{const n=Math.min(4,form.scourge);if(!copying)form.scourge-=n;if(G)G.beforeSkill(a);const p=params(a.id,'11');let meteorDamage=0;for(let k=0;k<n*4;k++)meteorDamage+=hit(a,p[1],[Math.floor(rng()*dummies.length)],'Каослана · метеор',{toughness:2.5});if(n===4){const finish=hit(a,p[0]/dummies.length,allTargets(),'Каослана · завершение навыка',{toughness:20});if(!copying&&a.s.eidolon>=2){form.extra=true;form.distance=0;record(a,'Фаенон E2 · дополнительный ход');}if(a.s.eidolon>=6)trueHit(a,(finish+meteorDamage)*.36,[0],'Фаенон E6 · истинный урон');}}afterAttack(a,false,a.actionKind);if(G){if(basic)G.afterBasic(a);else G.afterSkill(a);}}
    function phainonTurn(){const a=find('1408');beginAction(a);form.actions++;if(form.extra)form.extra=false;else form.turns++;form.distance=10000/7;record(a,'Каослана · действие '+form.turns+'/8');if(a.ode==='phainon')loseHP(a,a.currentHP*.15);if(form.turns===8){a.actionKind='ultimate';hit(a,9.6/dummies.length,allTargets(),'Каослана · последний удар',{toughness:20});afterAttack(a,true);if(a.ode==='phainon'){form.turns=0;form.scourge=4;record(a,'Вечное горение · новые 8 действий');runUlts();return;}form.active=false;a.phainonAtkStacks=Math.min(2,(a.phainonAtkStacks||0)+1);a.resource=Math.min(a.s.eidolon>=6?Infinity:15,a.resource+3);a.currentHP=Math.min(a.currentHP,stat(a).hp);for(const b of actors)buff(b,'1408','phainonEnd',{speedPct:.15},1);record(a,'Каослана · союзники возвращаются');}else{const basic=form.scourge<4;if(!basic)coup(a,()=>phainonPowered(a),true);phainonPowered(a,basic);heal(a,stat(a).hp*.2);}runUlts();}
    function dragonShield(owner,ratio,flat,only=null){const atk=stat(owner).atk,scale=G?.has(owner,'103',4)?1.2:1,value=(atk*ratio+flat)*scale,cap=(atk*.2+400)*3*scale;for(const a of only?[only]:actors){const before=a.dragonShield?.expires>=a.turn?a.dragonShield.amount:0;a.dragonShield={amount:Math.min(cap,before+value),expires:a.turn+3};finalHealing(a,owner);assist(a,owner);}record(owner,'Щит Души дракона · '+value.toFixed(2));}
    function dragonTurn(){const a=find('1414');if(!a||!dragon.active)return;dragon.acting=true;dragon.distance=10000;beginAction(a);record(a,'Душа дракона · ход, усилений '+dragon.enhanced);const p=params(a.id,'04'),shieldScale=dragon.enhanced>0&&a.s.eidolon>=2?2:1;dragonShield(a,p[0]*shieldScale,p[1]*shieldScale);const lowest=[...actors].sort((a,b)=>(a.dragonShield?.amount||0)+(a.avenShield?.amount||0)-(b.dragonShield?.amount||0)-(b.avenShield?.amount||0))[0];dragonShield(a,.05*shieldScale,100*shieldScale,lowest);if(dragon.enhanced>0){dragon.enhanced--;a.followups++;const bond=find(a.bondmate)||a;hit(a,.8,allTargets(),'Душа дракона · бонус-атака',{followup:true,toughness:20});hit(a,0,allTargets(),'Душа дракона · урон Соратника',{kind:'additional',element:data.characters[bond.id].element,baseDamage:stat(bond).atk*.8*shieldScale,toughness:0});hit(a,0,[0],'Душа дракона · Пик совершенства',{kind:'additional',element:data.characters[bond.id].element,baseDamage:stat(bond).atk*.4,toughness:0});if(a.odeEarth>0){a.odeEarth--;const shield=(bond.dragonShield?.amount||0)+(bond.avenShield?.amount||0)+(bond.shield?.amount||0);hit(a,0,allTargets(),'Ода земле · урон щита',{kind:'additional',element:data.characters[bond.id].element,baseDamage:shield*.8,toughness:0});}afterAttack(a,false,'followup');}dragon.acting=false;}
    function marchFollow(actor,master,target){
      const support=['Shaman','Warlock','Knight','Priest'].includes(data.characters[master.id].path);
      actor.followups++;beginAction(actor);hit(actor,.6,[target],'Март 7 E2 · бонус-атака',{followup:true,toughness:support?10:5});
      if(!support)hit(actor,params(actor.id,'02')[1],[target],'Март 7 · урон Учителя',{kind:'additional',element:data.characters[master.id].element,toughness:0});
      marchGain(actor);afterAttack(actor,false,'followup');
    }
    function marchGain(actor,n=1){const before=actor.marchCharge||0;actor.marchCharge=Math.min(10,before+n);actor.resource=actor.marchCharge;if(before<7&&actor.marchCharge>=7){energy(actor,5);actor.distance=0;record(actor,'Март 7 · продвижение 100%');}}
    function mydeiState(){const a=find('1404');if(!a||copying===a||a.mydeiActing)return;if(!a.vendetta&&(a.mydeiCharge||0)>=100){a.mydeiCharge-=100;a.vendettaHP=stat(a).hp*.5;a.vendetta=true;a.currentHP+=a.vendettaHP;heal(a,stat(a).hp*.25);a.distance=0;record(a,'Кровная месть · продвижение 100%');}a.resource=a.mydeiCharge||0;if(a.vendetta&&a.mydeiCharge>=(a.s.eidolon>=6?100:150)){a.mydeiActing=true;beginAction(a);a.actionKind='skill';record(a,'Мидей · дополнительное действие');coup(a,()=>batchSkill(a,true));batchSkill(a,true);if(G)G.afterSkill(a);a.mydeiActing=false;}}
    function batchSkill(actor,god=false){const id=actor.id,target=focusFor(actor),adj=allTargets().slice(1,3);actor.actionKind='skill';if(G)G.beforeSkill(actor);energy(actor,god?10:30);
      if(id==='1014'){buff(actor,id,'saberSkill',{critDamage:.5},2);const n=actor.resonance||0,full=n>0&&actor.energy+(copying===actor?30*stat(actor).energyRegen:0)+n*8>=360,p=params(id,'02'),extra=full?n*p[3]:0,bonus=full&&actor.s.eidolon>=2?n*.07:0;hit(actor,p[0]+extra,[0],'Сэйбер · навык',{toughness:20,bonus});if(adj.length)hit(actor,p[1]+extra,adj,'Сэйбер · соседние цели',{toughness:10,bonus});if(full){energy(actor,n*8/stat(actor).energyRegen);actor.resonance=0;actor.resource=0;if(actor.manaBurst&&!copying){actor.manaBurst=false;gainSP();actor.distance=0;record(actor,'Вспышка маны · продвижение 100%');}}else resonance(actor,3);if(actor.s.eidolon>=1&&!copying)resonance(actor,1);afterAttack(actor);}
      else if(id==='1015'){hit(actor,params(id,'02')[0],[0],'Арчер · навык '+((actor.circuit||0)+1),{toughness:20,bonus:Math.min(actor.s.eidolon>=6?3:2,actor.circuit||0)});if(!copying)actor.circuit=(actor.circuit||0)+1;afterAttack(actor);}
      else if(id==='1404'){if(god){if(!copying)actor.mydeiCharge-=actor.s.eidolon>=6?100:150;}else loseHP(actor,actor.currentHP*(actor.vendetta?.35:.5));const hp=stat(actor).hp,p=god?params(id,'11'):actor.vendetta?params(id,'09'):params(id,'02');hit(actor,0,god&&actor.s.eidolon>=1?allTargets():[0],god?'Убить бога, чтобы стать богом':actor.vendetta?'Убить царя, чтобы стать царём':'Мидей · навык',{baseDamage:hp*(p[0]+(god&&actor.s.eidolon>=1?.3:0)),toughness:god?30:20});if(adj.length&&!(god&&actor.s.eidolon>=1))hit(actor,0,adj,'Мидей · соседние цели',{baseDamage:hp*p[1],toughness:god?20:10});actor.resource=actor.mydeiCharge||0;afterAttack(actor);}
      else if(id==='1412'){if(actor.merit!==target.id){actor.cCharge=0;actor.merit=target.id;}actor.meritOwnAtk=stat(actor,true).atk;cCharge(actor,1);for(const a of new Set([actor,target]))buff(a,id,'cerydraSpeed',{speed:20},3);if(actor.s.eidolon>=1)energy(target,2);assist(target,actor);record(actor,'Боевые заслуги → '+data.characters[target.id].name);}
      else if(id==='1414'){actor.bondOwnAtk=stat(actor,true).atk;actor.bondmate=target.id;dragon.active=true;actor.dragonActive=true;dragonShield(actor,params(id,'02')[0],params(id,'02')[1]);record(actor,'Соратник → '+data.characters[target.id].name);}
      else if(id==='1207'){actor.bow=2;actor.bowCrit=false;actor.bowAcquiredTurn=actor.turn;for(const a of actors)assist(a,actor);record(actor,'Ревущая тетива · 2 уровня');}
      else if(id==='1215'){actor.burden=0;actor.burdenHits=0;actor.burdenRefunds=0;if(actor.s.eidolon>=2)buff(actor,id,'hanyaE2',{speedPct:.2},1);hit(actor,params(id,'02')[0],[0],'Ханья · Ноша',{toughness:20});afterAttack(actor);}
      else if(id==='1223'){hit(actor,params(id,'02')[0],[0],'Моцзэ · навык',{toughness:20});afterAttack(actor);actor.prey=0;actor.mozeCharge=9;actor.mozeSpent=0;actor.departed=true;actor.resource=9;debuffApplied(actor);record(actor,'Отсутствие · 9 зарядов');}
      else if(id==='1224'){if(actor.master!==target.id){for(const a of actors)a.buffs=a.buffs.filter(b=>b.source!==id||b.key!=='marchMasterSpeed');actor.master=target.id;}buff(target,id,'marchMasterSpeed',{speedPct:params(id,'02')[0]},100000);assist(target,actor);record(actor,'Учитель → '+data.characters[target.id].name);}
    }
    function batchRegular(actor,extra=false){const id=actor.id;if(!['1014','1015','1404','1412','1414','1201','1207','1215','1223','1224'].includes(id))return false;
      const target=focusFor(actor);let use=actor.s.policy!=='basic'&&sp>=(id==='1015'?2:1);
      if(id==='1014'&&actor.saberEnhanced)use=false;
      if(id==='1404'&&actor.vendetta)use=true;
      if(id==='1412'&&actor.s.policy!=='skill')use=use&&(!actor.merit||!target.buffs.some(b=>b.source===id&&b.key==='cerydraSpeed'&&b.expires>target.turn));
      if(id==='1414'&&actor.s.policy!=='skill')use=use&&(!actor.bondmate||actors.some(a=>!(a.dragonShield?.expires>a.turn)));
      if(id==='1207'&&actor.s.policy!=='skill')use=use&&!(actor.bow>0);
      if(id==='1215'&&actor.s.policy!=='skill')use=use&&actor.burden===undefined;
      if(id==='1223')use=use&&actors.length>1;
      if(id==='1224')use=use&&actors.length>1&&!(actor.marchCharge>=7)&&(actor.s.policy==='skill'||!actor.master);
      if(id==='1201'){
        let draws=0,autarky=false;while(use&&!actor.kong&&sp>0&&draws<20){beginAction(actor);actor.actionKind='skill';spendSP();if(G)G.beforeSkill(actor);if(!actor.qFirst){actor.qFirst=true;gainSP();}drawTile(actor,2);if(actor.s.eidolon>=4&&!autarky&&rng()<.24)autarky=true;draws++;cerydraAction(actor);yukongAction(actor);if(G)G.afterSkill(actor);record(actor,'Цинцюэ · добор '+actor.tiles.join(''));}actor.qDraws=Math.min(4,draws);
        if(draws)beginAction(actor);actor.actionKind='basic';const enhanced=actor.kong,[main,side]=enhanced?data.character_skills['120108'].params[actor.s.eidolon>=5?6:5]:params(id,'01'),bonus=actor.qDraws*(.38+params(id,'02')[1]-data.character_skills['120102'].params[9][1]);if(enhanced){if(actor.s.eidolon>=6)gainSP();energy(actor,20);hit(actor,main,[0],'Вишенка на торте!',{toughness:20,bonus});if(dummies.length>1)hit(actor,side,allTargets().slice(1,3),'Цинцюэ · соседние цели',{toughness:10,bonus});actor.tiles=[];actor.kong=false;buff(actor,id,'qingqueSpeed',{speedPct:.1},1);}else{gainSP();energy(actor,20);hit(actor,main,[0],'Базовая Цинцюэ',{toughness:10,bonus});const counts=[0,0,0];for(const t of actor.tiles||[])counts[t]++;if(actor.tiles?.length){const least=Math.min(...actor.tiles.map(t=>counts[t]));actor.tiles.splice(actor.tiles.findIndex(t=>counts[t]===least),1);}}afterAttack(actor,false,'basic');if(G)G.afterBasic(actor);if(autarky){actor.followups++;beginAction(actor);hit(actor,main,[0],'Цинцюэ E4 · Независимость',{followup:true,group:true,toughness:enhanced?20:10,bonus});if(enhanced&&dummies.length>1)hit(actor,side,allTargets().slice(1,3),'Независимость · соседние цели',{followup:true,group:true,toughness:10,bonus});if(G)G.followupEnd(actor,actors);afterAttack(actor,false,'followup');}return true;
      }
      if(id==='1015'&&use){actor.circuit=0;for(let n=0;n<5&&sp>=2&&!form.active;n++){actor.archerActiveUses=n+1;if(n)beginAction(actor);spendSP();spendSP();coup(actor,()=>batchSkill(actor));batchSkill(actor);if(actor.s.eidolon>=1&&n===2){gainSP(2);record(actor,'Арчер E1 · восстановлено 2 SP');}if(G)G.afterSkill(actor);runUlts();}actor.circuit=0;return true;}
      if(use){if(!(id==='1404'&&actor.vendetta))spendSP();coup(actor,()=>batchSkill(actor));batchSkill(actor);if(G)G.afterSkill(actor);return true;}
      actor.actionKind='basic';const saber=id==='1014'&&actor.saberEnhanced,march=id==='1224'&&actor.marchCharge>=7;
      if(!march)gainSP();energy(actor,saber||march?30:20);
      if(id==='1014'&&actor.s.eidolon>=1)resonance(actor,1);
      if(saber){const [damage,,two,one]=data.character_skills['101408'].params[actor.s.eidolon>=3?6:5];resonance(actor,2);actor.saberEnhanced=false;actor.manaBurst=true;hit(actor,damage,allTargets(),'Отпущенный золотой скипетр',{toughness:20});if(dummies.length<=2)hit(actor,dummies.length===1?one:two,allTargets(),'Золотой скипетр · дополнительный урон',{kind:'additional'});}
      else if(march){actor.marchCharge-=7;actor.resource=actor.marchCharge;let count=3+(actor.marchUlt?2:0),chance=actor.marchUlt?.8:.6;for(let n=0;n<3&&rng()<chance;n++)count++;const [damage]=data.character_skills['122408'].params[actor.s.eidolon>=3?6:5],extraCritDamage=actor.marchUlt&&actor.s.eidolon>=6?.5:0,master=find(actor.master),support=master&&['Shaman','Warlock','Knight','Priest'].includes(data.characters[master.id].path);for(let n=0;n<count;n++){hit(actor,damage,[0],'Март 7 · усиленный удар',{toughness:5*(support?2:1),bonus:.8,extraCritDamage});if(master&&!support)hit(actor,.2,[0],'Март 7 · урон Учителя',{kind:'additional',element:data.characters[master.id].element,bonus:.8});}actor.marchUlt=false;if(master)buff(master,id,'marchGift',{critDamage:.6,breakEffect:.36},2);record(actor,'Март 7 · '+count+' усиленных ударов');}
      else{const yuk=id==='1207'&&actor.turn>=(actor.yukongReady||0),master=id==='1224'?find(actor.master):null,support=master&&['Shaman','Warlock','Knight','Priest'].includes(data.characters[master.id].path);hit(actor,id==='1404'?0:['1014','1015','1207','1215','1223','1224'].includes(id)?params(id,'01')[0]:1,[0],'Базовая атака',{toughness:yuk||support?20:10,baseDamage:id==='1404'?stat(actor).hp*.5:undefined});if(yuk){hit(actor,params(id,'04')[0],[0],'Семь слоёв Юйкун',{kind:'additional'});actor.yukongReady=actor.turn+2;}if(id==='1224'){marchGain(actor);if(master&&!support)hit(actor,.2,[0],'Март 7 · урон Учителя',{kind:'additional',element:data.characters[master.id].element});}}
      afterAttack(actor,false,'basic');if(G)G.afterBasic(actor);return true;
    }
    function batchUlt(actor){const id=actor.id,all=allTargets();
      if(id==='1014'){const [damage,bounce,count]=params(id,'03'),s=stat(actor),bonus=actor.s.eidolon>=1?.6:0;if(actor.s.eidolon>=6){s.resPen+=.2;if((actor.ults-1)%3===0)energy(actor,300/stat(actor).energyRegen);}hit(actor,damage,all,'Экскалибур',{toughness:20,statSnapshot:s,bonus});for(let n=0;n<count;n++)hit(actor,bounce,[Math.floor(rng()*dummies.length)],'Экскалибур · отскок',{toughness:4,statSnapshot:s,bonus});actor.saberEnhanced=true;afterAttack(actor,true);}
      else if(id==='1015'){actor.archerCharge=Math.min(4,(actor.archerCharge||0)+2);actor.resource=actor.archerCharge;if(actor.s.eidolon>=2){dummies[0].archerQuantumUntil=dummies[0].turn+2;debuffApplied(actor,0);}hit(actor,params(id,'03')[0],[0],'Ульта Арчера',{toughness:30,bonus:actor.s.eidolon>=4?1.5:0});afterAttack(actor,true);}
      else if(id==='1404'){heal(actor,stat(actor).hp*.2);actor.mydeiCharge=Math.min(200,(actor.mydeiCharge||0)+20);hit(actor,0,[0],'Ульта Мидея',{baseDamage:stat(actor).hp*params(id,'03')[0],toughness:20});if(all.length>1)hit(actor,0,all.slice(1,3),'Ульта Мидея · соседние цели',{baseDamage:stat(actor).hp*params(id,'03')[1],toughness:20});for(const i of all.slice(0,3))dummies[i].tauntUntil=dummies[i].turn+2;debuffApplied(actor);afterAttack(actor,true);}
      else if(id==='1412'){if(!actor.merit){actor.merit=actors[0].id;actor.meritOwnAtk=stat(actor,true).atk;}cCharge(actor,2);actor.cExtra=0;hit(actor,params(id,'03')[0]+(actor.s.eidolon>=4?2.4:0),all,'Ульта Керидры',{toughness:20});afterAttack(actor,true);}
      else if(id==='1414'){const p=params(id,'03'),bond=find(actor.bondmate);dragon.enhanced=p[2]+(actor.s.eidolon>=2?2:0);if(actor.s.eidolon>=2&&dragon.active)dragon.distance=0;if(actor.s.eidolon>=1){gainSP();if(bond)buff(bond,id,'dan1414E1',{resPen:.18},3);}hit(actor,p[0],all,'Ульта Освободителя Пустошей',{toughness:20});dragonShield(actor,p[3],p[4]);if(actor.s.eidolon>=6&&bond)hit(bond,3.3,all,'Освободитель Пустошей E6 · урон Соратника',{kind:'additional',toughness:0});afterAttack(actor,true);}
      else if(id==='1201'){hit(actor,params(id,'03')[0],all,'Ульта Цинцюэ',{toughness:20,bonus:actor.s.eidolon>=1?.1:0});actor.tiles=[0,0,0,0];actor.kong=true;afterAttack(actor,true);}
      else if(id==='1207'){actor.yukongCredits?.clear();if(actor.s.eidolon>=6){actor.bow=Math.min(2,(actor.bow||0)+1);actor.bowAcquiredTurn=actor.turn;}if(actor.bow>0)actor.bowCrit=true;hit(actor,params(id,'03')[0],[0],'Ульта Юйкун',{toughness:30});afterAttack(actor,true);}
      else if(id==='1215'){const target=focusFor(actor),[atk,duration,speed]=params(id,'03');buff(target,id,'hanyaUlt',{atk,speed:stat(actor).speed*speed},duration+(target===activeActor?1:0)+(actor.s.eidolon>=4?1:0));assist(target,actor);record(actor,'Ульта Ханьи → '+data.characters[target.id].name);}
      else if(id==='1223'){if(actor.s.eidolon>=4)buff(actor,id,'mozeE4',{damage:.3},2);hit(actor,params(id,'03')[0],[0],'Ульта Моцзэ',{followup:true,ultimate:true,toughness:30});afterAttack(actor,true,'followup');mozeFollow(actor);}
      else if(id==='1224'){actor.marchUlt=true;hit(actor,params(id,'03')[0],[0],'Ульта Март 7',{toughness:30});afterAttack(actor,true);}
      else return false;return true;
    }
    function mozeFollow(actor){actor.followups++;energy(actor,10);if(actor.turn>=(actor.mozeSPReady||0)){gainSP();actor.mozeSPReady=actor.turn+1;}hit(actor,params(actor.id,'04')[2]+(actor.s.eidolon>=6?.25:0),[0],'Моцзэ · бонус-атака',{followup:true,toughness:10});afterAttack(actor,false,'followup');}
    function implanted(actor,targets){const a=find('1321');if(!a)return;buff(actor,a.id,'implantSpeed',{speedPct:.3},2);if(data.characters[actor.id].element==='Fire'){for(const i of targets)reduceToughness(actor,i,20/efficiency(actor));energy(actor,Math.min(.5,targets.length*.1)*data.characters[actor.id].max_sp/stat(actor).energyRegen);}}
    function sampoWind(actor,targets){
      const [chance,damage,duration,maxStacks]=params(actor.id,'04');
      for(const i of targets)if(rng()<effectChance(actor,chance,i)){
        const d=dummies[i];d.sampoStacks=Math.min(maxStacks,(d.sampoWind?d.sampoStacks||0:0)+1);
        d.sampoWind={owner:actor.id,expires:d.turn+duration+1,coefficient:(damage+(actor.s.eidolon>=6?.15:0))*d.sampoStacks};debuffApplied(actor,i);
      }
    }
    function lukaGain(actor,n){actor.will=Math.min(4,(actor.will||0)+n);if(actor.s.eidolon>=4)actor.lukaE4=Math.min(4,(actor.lukaE4||0)+n);energy(actor,3*n);}
    function sushangSpeed(actor){
      const [speedPct,duration]=params(actor.id,'04');
      const previous=actor.buffs.find(b=>b.key==='sushangSpeed'&&b.expires>=actor.turn)?.values.speedPct||0;
      buff(actor,actor.id,'sushangSpeed',{speedPct:Math.min(previous+speedPct,speedPct*(actor.s.eidolon>=6?2:1))},duration);
    }
    function breakRegular(actor){
      if(!['1310','1315','1317','1321','8005','1301','1214','1111','1206','1108'].includes(actor.id))return false;
      const id=actor.id,all=allTargets(),adj=all.slice(1,3),target=focusFor(actor);let useSkill=actor.s.policy!=='basic'&&sp>0;
      if(id==='1321'&&actor.s.policy!=='skill')useSkill=useSkill&&!(actor.dahliaUntil>actor.turn);
      if(id==='1301'&&actor.s.policy!=='skill')useSkill=useSkill&&actors.some(a=>a.currentHP<stat(a).hp*.6);
      if(id==='1111'&&actor.s.eidolon>=1&&(dummies[0].lukaBleed||dummies[0].breakStatuses?.Physical))buff(actor,id,'lukaE1',{damage:.15},2);
      if(id==='1111'&&actor.s.policy!=='skill')useSkill=useSkill&&!(actor.will>=2)&&!dummies[0].lukaBleed;
      if(id==='8005'&&actor.s.policy!=='skill')useSkill=useSkill&&sp>=2;
      if(id==='1317'&&actor.ink>0)useSkill=false;
      if(id==='1315'){
        if(actor.s.policy!=='basic'&&!(actor.duelUntil>actor.turn)&&sp>0){spendSP();actor.duelUntil=actor.turn+2;dummies[0].tauntUntil=dummies[0].turn+2;debuffApplied(actor);record(actor,'Дуэль · без завершения хода');}
        useSkill=false;
      }
      const freeFireflySkill=id==='1310'&&actor.combustionUntil>now&&actor.s.eidolon>=1;
      if(freeFireflySkill&&actor.s.policy!=='basic')useSkill=true;
      actor.actionKind=useSkill?'skill':'basic';if(useSkill){coup(actor,()=>breakRegular(actor),true);if(!freeFireflySkill)spendSP();if(G)G.beforeSkill(actor);}else if(!(id==='1315'&&actor.duelUntil>actor.turn)&&!(id==='1317'&&actor.ink>0))gainSP();
      if(id==='1310'&&actor.combustionUntil>now){
        const be=Math.min(3.6,breakValue(actor));actor.fireflyEnhanced=true;actor.fireflySkill=useSkill;if(useSkill){const p=data.character_skills['131009'].params[actor.s.eidolon>=3?11:9];heal(actor,stat(actor).hp*p[2]);hit(actor,p[0]+p[4]*be,[0],'Светлячок · усиленный навык',{toughness:30});if(adj.length)hit(actor,p[1]+p[5]*be,adj,'Светлячок · соседние цели',{toughness:15});actor.fireflyEnhanced=false;implanted(actor,[0]);}else{const [damage,restore]=data.character_skills['131008'].params[actor.s.eidolon>=3?6:5];heal(actor,stat(actor).hp*restore);hit(actor,damage,[0],'Светлячок · усиленная базовая',{toughness:15});actor.fireflyEnhanced=false;}
      }else if(id==='1317'&&actor.ink>0){
        energy(actor,20);for(let n=0;n<2;n++){hit(actor,data.character_skills['131708'].params[actor.s.eidolon>=5?6:5][0],[0],'Раппа · лепестки '+(n+1),{toughness:actor.s.eidolon>=2?15:10});if(adj.length)hit(actor,data.character_skills['131708'].params[actor.s.eidolon>=5?6:5][1],adj,'Раппа · соседние лепестки',{toughness:5});}hit(actor,data.character_skills['131712'].params[actor.s.eidolon>=5?6:5][0],all,'Раппа · третий удар',{toughness:5});const charges=actor.rappaCharges||0;actor.rappaCharges=actor.s.eidolon>=6?5:0;for(const i of all){reduceToughness(actor,i,2+charges);breakDamage(actor,i,params(id,'04')[2]+params(id,'04')[4]*charges,'Imaginary','Раппа · брейк таланта');}afterAttack(actor);actor.ink--;if(!actor.ink&&actor.s.eidolon>=1)energy(actor,20);record(actor,'Цветные чернила · '+actor.ink);if(G)G.afterBasic(actor);return true;
      }else if(id==='1315'&&actor.duelUntil>actor.turn){
        const stacks=actor.pocket||0;energy(actor,30);hit(actor,data.character_skills['131508'].params[actor.s.eidolon>=3?6:5][0],[0],'Бутхилл · усиленная базовая',{toughness:20*(1+.5*stacks)});if(maxToughness&&dummies[0].toughness===0&&actor.pocket>0){const damage=params(id,'04')[actor.pocket-1];breakDamage(actor,0,damage,'Physical','Бутхилл · повторное пробитие',160);if(actor.s.eidolon>=6){breakDamage(actor,0,damage*.4,'Physical','Бутхилл E6 · дополнительное пробитие',160);if(adj.length)breakDamage(actor,adj[0],damage*.7,'Physical','Бутхилл E6 · соседнее пробитие',160);}}
      }else if(id==='1111'&&!useSkill&&actor.will>=2){
        actor.will-=2;energy(actor,20);
        const [direct,uppercut]=data.character_skills['111108'].params[actor.s.eidolon>=5?6:5];
        let directHits=0;
        for(let n=0;n<3;n++){
          hit(actor,direct,[0],'Лука · прямой удар',{toughness:2});directHits++;
          if(rng()<.5){hit(actor,direct,[0],'Лука · дополнительный удар',{toughness:0});directHits++;}
        }
        hit(actor,uppercut,[0],'Лука · апперкот',{toughness:4});
        const ratio=params(id,'04')[1]+(actor.s.eidolon>=6?.08*directHits:0);
        if(dummies[0].lukaBleed)dotHit(0,'lukaBleed',ratio,'Лука · подрыв Кровотечения');
        breakTick(0,ratio,false,'Physical');
      }else if(id==='1301'&&!useSkill&&actor.gallagherEnhanced){energy(actor,20);hit(actor,data.character_skills['130108'].params[actor.s.eidolon>=3?6:5][0],[0],'Галлахер · Нектарный блиц',{toughness:30});debuffApplied(actor);
      }else if(useSkill){
        if(id!=='1310')energy(actor,30);
        if(id==='1310'){const [damage,cost,restore]=params(id,'02');loseHP(actor,stat(actor).hp*cost);energy(actor,240*restore/stat(actor).energyRegen);hit(actor,damage,[0],'Светлячок · навык',{toughness:20});actor.distance=Math.max(0,actor.distance-2500);}
        if(id==='1317')hit(actor,params(id,'02')[0],all,'Раппа · навык',{toughness:10});
        if(id==='1321'){actor.dahliaUntil=actor.turn+3;hit(actor,params(id,'02')[0],all.slice(0,3),'Георгина · зона',{toughness:10});}
        if(id==='8005'){if(actor.s.eidolon>=1&&!actor.hmcRefund){actor.hmcRefund=true;gainSP();record(actor,'Первопроходец E1 · восстановлено 1 SP');}const p=params(id,'02');for(let n=0;n<5+(actor.s.eidolon>=6?2:0);n++)hit(actor,p[0],[n?Math.floor(rng()*dummies.length):0],'Первопроходец · попадание '+(n+1),{toughness:n?5:10});}
        if(id==='1301'){const patient=[...actors].sort((a,b)=>a.currentHP/stat(a).hp-b.currentHP/stat(b).hp)[0];heal(patient,params(id,'02')[0],actor);if(actor.s.eidolon>=2)buff(patient,id,'gallagherE2',{effectRes:.3},2);assist(patient,actor);}
        if(id==='1214'){const p=params(id,'02');hit(actor,p[0],[0],'Сюэи · навык',{toughness:20});if(adj.length)hit(actor,p[1],adj,'Сюэи · соседние цели',{toughness:10});}
        if(id==='1111'){const [damage,chance,,bleed,duration]=params(id,'02');hit(actor,damage,[0],'Лука · навык',{toughness:20});if(rng()<effectChance(actor,chance,0)){dummies[0].lukaBleed={owner:id,coefficient:bleed,expires:dummies[0].turn+duration};debuffApplied(actor);}lukaGain(actor,actor.s.eidolon>=2?2:1);}
        if(id==='1206'){const [damage,sword,chance]=params(id,'02'),alreadyBroken=maxToughness&&dummies[0].toughness===0;hit(actor,damage,[0],'Сушан · навык',{toughness:20});if(alreadyBroken&&actor.s.eidolon>=1)gainSP();const broken=!maxToughness||dummies[0].toughness===0;if(broken||rng()<chance){hit(actor,sword,[0],'Стойка меча',{kind:'additional',bonus:Math.min(10,actor.swordStacks||0)*.025});actor.swordStacks=Math.min(10,(actor.swordStacks||0)+1);}if(actor.sushangUntil>=actor.turn)for(let n=0;n<2;n++)if(broken||rng()<chance){hit(actor,sword*params(id,'03')[2],[0],'Стойка меча · дополнительная',{kind:'additional',bonus:Math.min(10,actor.swordStacks||0)*.025});actor.swordStacks=Math.min(10,(actor.swordStacks||0)+1);}}
        if(id==='1108'){
          const [bounces,damage]=params(id,'02');
          for(let n=0;n<=bounces+(actor.s.eidolon>=1?1:0);n++){
            const i=n?Math.floor(rng()*dummies.length):0,d=dummies[i];
            hit(actor,damage,[i],'Сампо · отскок',{toughness:n?5:10});
            if(actor.s.eidolon>=4&&d.sampoWind?.expires>=d.turn&&d.sampoStacks>=5)dotHit(i,'sampoWind',.08,'Сампо E4 · подрыв Выветривания');
            sampoWind(actor,[i]);
          }
        }
      }else{energy(actor,20);hit(actor,['1301','1108','1111','1206','1310','1214','1315','1317','1321','8005'].includes(id)?params(id,'01')[0]:1,[0],'Базовая атака',{toughness:10});if(id==='1111')lukaGain(actor,1);if(id==='1108')sampoWind(actor,[0]);}
      if(!(id==='1301'&&useSkill))afterAttack(actor,false,actor.actionKind);actor.fireflySkill=false;actor.gallagherEnhanced=false;if(G){if(useSkill)G.afterSkill(actor);else G.afterBasic(actor);}return true;
    }
    function breakUlt(actor){const id=actor.id,all=allTargets();
      if(id==='1310'){actor.combustionUntil=now+10000/70;actor.distance=0;record(actor,'Полное сгорание · отсчёт SPD 70');}
      else if(id==='1315'){const p=params(id,'03');hit(actor,p[0],[0],'Ульта Бутхилла',{toughness:30});dummies[0].distance+=10000*p[1];implanted(actor,[0]);afterAttack(actor,true);}
      else if(id==='1317'){actor.ink=params(id,'03')[2];actor.distance=0;record(actor,'Форма печати · 3 усиленные базовые');}
      else if(id==='1321'){hit(actor,params(id,'03')[0]/all.length,all,'Ульта Георгины',{toughness:20});implanted(actor,all);afterAttack(actor,true);}
      else if(id==='8005'){actor.hmcUntil=actor.turn+3;record(actor,'Запасной танцор · суперпробитие и BE');}
      else if(id==='1301'){const p=params(id,'03');for(const d of dummies)d.besottedUntil=d.turn+p[1]+(actor.s.eidolon>=4?1:0);debuffApplied(actor);hit(actor,p[0],all,'Ульта Галлахера',{toughness:20});actor.gallagherEnhanced=true;actor.distance=0;afterAttack(actor,true);}
      else if(id==='1214'){if(actor.s.eidolon>=4)buff(actor,id,'xueyiE4',{breakEffect:.4},2);const p=params(id,'03'),available=maxToughness?dummies[0].toughness:0,removed=Math.min(40*efficiency(actor),available),bonus=Math.min(p[2],removed/10*p[1])+(available>=maxToughness*.5&&maxToughness?.1:0);hit(actor,p[0],[0],'Ульта Сюэи',{toughness:40,bonus});afterAttack(actor,true);}
      else if(id==='1111'){const [damage,chance,,duration,gain]=params(id,'03');lukaGain(actor,gain);if(rng()<effectChance(actor,chance,0)){dummies[0].lukaVulnUntil=dummies[0].turn+duration;debuffApplied(actor);}hit(actor,damage,[0],'Ульта Луки',{toughness:30});afterAttack(actor,true);}
      else if(id==='1206'){const [damage,duration,,atk]=params(id,'03');hit(actor,damage,[0],'Ульта Сушан',{toughness:30});buff(actor,id,'sushangAtk',{atk},duration);actor.sushangUntil=actor.turn+duration;actor.distance=0;afterAttack(actor,true);}
      else if(id==='1108'){const [damage,,duration,chance]=params(id,'03');hit(actor,damage,all,'Ульта Сампо',{toughness:20});sampoWind(actor,all);for(const i of all)if(rng()<effectChance(actor,chance,i)){dummies[i].sampoVulnUntil=dummies[i].turn+duration;debuffApplied(actor,i);}energy(actor,10);afterAttack(actor,true);}
      else return false;return true;
    }
    function targetSpeed(index){const d=dummies[index];return Math.max(1,100*(1-(d.breakSlowUntil>d.turn?.1:0)-(d.slowUntil>d.turn?(d.danSlow||.12):0)-(d.weltSlowUntil>d.turn?.1:0)-(d.imprisonedUntil>d.turn?.1:0)-(d.swSpeedUntil>d.turn?.06:0)-(d.gepardSlowUntil>d.turn?.2:0)));}
    function spendSP(virtual=false){if(copying)return;if(activeActor)activeActor.actionSPSpent=(activeActor.actionSPSpent||0)+1;if(!virtual){sp--;const il=find('1213');if(il?.s.exEidolon&&activeActor&&activeActor!==il){il.exSpent=(il.exSpent||0)+1;if(il.exSpent>=5){il.exSpent-=5;queueFinal('imbibitorEX',il);}}}if(!virtual||virtual==='thrill'){rinSP(1);const mi=find('1312');if(mi){mi.mishaHits=Math.min(10,(mi.mishaHits||3)+1);mi.resource=mi.mishaHits;energy(mi,params(mi.id,'04')[0]);}}wolfSpend();turnSPSpent++;if(G)G.skillPointSpent(actors,turnSPSpent);const sparkle=find('1306');if(sparkle)for(const a of actors){const count=a.buffs.find(b=>b.source==='1306'&&b.key==='sparkleTalent')?.values.stacks||0;buff(a,'1306','sparkleTalent',{stacks:Math.min(3,count+1)},2);}}
    function silverBug(actor,index=0){if(rng()<effectChance(actor,params('1006','04')[3],index)){const key=['swAtkUntil','swDefUntil','swSpeedUntil'][Math.floor(rng()*3)];dummies[index][key]=dummies[index].turn+4;debuffApplied(actor);record(actor,'Баг · '+key);}}
    function ash(actor,targets,chance=1,fromTalent=true){for(const i of targets)if(rng()<effectChance(actor,chance,i)){const d=dummies[i],p=params('1218','04');d.ashStacks=Math.min(actor.s.eidolon>=6?9:p[3],(d.ashenBurn?d.ashStacks||0:0)+(actor.s.eidolon>=1&&fromTalent?2:1));d.ashenBurn={owner:actor.id,expires:d.turn+p[4],coefficient:p[5]+(actor.s.eidolon>=2?3:0)};debuffApplied(actor);record(actor,'Жаркий пепел · '+d.ashStacks+' ур.');}}
    function huohuoHeal(target){const hh=find('1217');if(!hh||!(hh.divineUntil>hh.turn))return;const list=[target,...actors.filter(a=>a!==target&&a.currentHP<=stat(a).hp*.5)];for(const a of list){heal(a,stat(hh).hp*params('1217','04')[2]+params('1217','04')[4],hh);energy(hh,1);}}
    function aventShield(actor,ratio=.24,flat=320,extraTarget=null){const value=(stat(actor).def*ratio+flat)*(G?.has(actor,'103',4)?1.2:1),cap=(stat(actor).def*.24+320)*2*(G?.has(actor,'103',4)?1.2:1);for(const a of extraTarget?[extraTarget]:actors){const previous=a.avenShield?.expires>=a.turn?a.avenShield.amount:0;a.avenShield={amount:Math.min(cap,previous+value),expires:a.turn+3};finalHealing(a,actor);}record(actor,'Укреплённая ставка · '+value.toFixed(2));}
    function aventFollow(actor){if((actor.blindBet||0)<7)return;actor.blindBet-=7;actor.resource=actor.blindBet;actor.followups++;energy(actor,1);if(actor.s.eidolon>=4)buff(actor,actor.id,'aventE4',{def:.4},2);if(G)G.followupStart(actor);const talent=params('1304','04');const hits=talent[1]+(actor.s.eidolon>=4?3:0);for(let n=0;n<hits;n++)hit(actor,0,[Math.floor(rng()*dummies.length)],'Авантюрин · попадание бонус-атаки',{followup:true,group:true,baseDamage:stat(actor).def*talent[2],toughness:10/7});if(G)G.followupEnd(actor,actors);const lowest=[...actors].sort((a,b)=>(a.avenShield?.amount||0)-(b.avenShield?.amount||0))[0];aventShield(actor,.072,96);aventShield(actor,.072,96,lowest);afterAttack(actor,false,'followup');}
    function jadeFollow(actor){if((actor.jadeCharges||0)<8)return;actor.jadeCharges-=8;actor.resource=actor.jadeCharges;actor.followups++;energy(actor,10);const boosted=actor.jadeEnhanced>0;if(boosted)actor.jadeEnhanced--;hit(actor,params(actor.id,'04')[4]+(boosted?params(actor.id,'03')[0]:0),allTargets(),'Яшма · бонус-атака',{followup:true,bonus:actor.s.eidolon>=1?.32:0});actor.pawn=Math.min(50,(actor.pawn||0)+5);afterAttack(actor,false,'followup',true);}
    function ilHits(actor,weights,main,adjacent=0,roar=false,ultimate=false){for(let n=0;n<weights.length;n++){if(roar&&n>=3){actor.outroar=Math.min(4,(actor.outroar||0)+1);if(actor.s.eidolon>=4)actor.outroarUntil=actor.turn+1;}const s=stat(actor),bonus=(actor.righteous||0)*params('1213','04')[0],extraCritDamage=.24+(actor.outroar||0)*.12;hit(actor,main*weights[n],[0],'Пожиратель Луны · удар '+(n+1),{statSnapshot:s,bonus,extraCritDamage});if(adjacent&&(ultimate||n>=3))hit(actor,ultimate?adjacent*weights[n]:adjacent/(weights.length-3),allTargets().slice(1,3),'Пожиратель Луны · соседние цели',{statSnapshot:s,bonus,extraCritDamage});actor.righteous=Math.min(6+(actor.s.eidolon>=1?4:0),(actor.righteous||0)+(actor.s.eidolon>=1?2:1));}}
    function ilBasic(actor){const level=actor.s.policy==='basic'?0:Math.min(3,sp+(actor.squama||0)),key=['121301','121308','121310','121312'][level],p=data.character_skills[key].params[actor.s.eidolon>=3?6:5];actor.actionKind='basic';for(let n=0;n<level;n++){if(actor.squama>0){actor.squama--;spendSP(true);}else spendSP();}actor.resource=actor.squama||0;if(!level)gainSP();energy(actor,[20,30,35,40][level]);record(actor,'Усиление базовой · '+level);actor.ilLeap=level===3;ilHits(actor,[[.3,.7],[.33,.33,.34],[.2,.2,.2,.2,.2],[.142,.142,.142,.142,.142,.142,.148]][level],p[0],p[1]||0,level>=2);if(actor.ilLeap)actor.ilPen=0;actor.ilLeap=false;afterAttack(actor,false,'basic');if(G)G.afterBasic(actor);}
    function argentiTalent(actor,count){actor.apotheosis=Math.min(10+(actor.s.eidolon>=4?2:0),(actor.apotheosis||0)+count);energy(actor,params('1302','04')[0]*count);}
    function weltTalent(actor,targets){for(const i of targets)if(slowed(i)){hit(actor,params('1004','04')[0],[i],'Талант Вельта',{kind:'additional',bonus:!maxToughness||dummies[i].toughness===0?.2:0});if(actor.s.eidolon>=2)energy(actor,3);}}
    function jingliuGain(actor,amount){const e6=actor.s.eidolon>=6;actor.syzygy=Math.min(3+(e6?1:0),(actor.syzygy||0)+amount);if(!actor.transmigration&&actor.syzygy>=2){if(e6)actor.syzygy++;actor.transmigration=true;actor.distance=0;record(actor,'Спектральная трансмиграция · продвижение 100%');}actor.resource=actor.syzygy;}
    function jingliuSnapshot(actor){if(!actor.transmigration)return stat(actor);let lost=0;for(const a of livingAllies())if(a!==actor){const before=a.currentHP;if(copying===actor)lost+=Math.min(stat(a).hp*.04,Math.max(0,before-1));else{loseHP(a,stat(a).hp*.04);lost+=before-a.currentHP;}}const s=stat(actor);const p=params(actor.id,'04');s.atk+=Math.min(actor.s.baseAtk*p[3],lost*p[2]);if(actor.s.eidolon>=4)s.atk+=Math.min(actor.s.baseAtk*.3,lost*.9);record(actor,'Цзинлю · поглощено HP '+lost.toFixed(2));return s;}
    function jingliuE1(actor){
      if(actor.s.eidolon>=1)buff(actor,actor.id,'jingliuE1',{critDamage:.24},1);
    }
    function jingliuSingleTarget(actor,s){
      if(actor.s.eidolon>=1&&dummies.length===1)hit(actor,1,[0],'Цзинлю E1 · дополнительный урон',{statSnapshot:s,kind:'additional',toughness:0});
    }
    function jingliuEnhanced(actor){const p=data.character_skills['121209'].params[actor.s.eidolon>=5?11:9];actor.actionKind='skill';if(G)G.beforeSkill(actor);energy(actor,30);jingliuE1(actor);const s=jingliuSnapshot(actor),bonus=actor.jingliuE2?.8:0;if(!copying)actor.jingliuE2=false;hit(actor,p[0],[0],'Луна на застывшей реке',{statSnapshot:s,bonus});if(dummies.length>1)hit(actor,p[2],allTargets().slice(1,3),'Луна на застывшей реке · соседние цели',{statSnapshot:s,bonus});jingliuSingleTarget(actor,s);if(!copying)actor.syzygy--;actor.resource=actor.syzygy;if(!actor.syzygy){actor.transmigration=false;record(actor,'Спектральная трансмиграция · окончание');}afterAttack(actor);if(G)G.afterSkill(actor);settleHP();}
    function luochaFlower(actor){if(actor.fieldUntil>actor.turn)return;actor.flowers=(actor.flowers||0)+1;if(actor.flowers>=2){actor.flowers=0;actor.fieldUntil=actor.turn+2;if(actor.s.eidolon>=4)debuffApplied(actor);record(actor,'Поле Цветка Бездны · начало');}}
    function settleHP(){if(form.active)return;const luocha=find('1203'),fu=find('1208');if(luocha&&luocha.turn>=(luocha.autoHealReady||0)){const patient=actors.find(a=>a.currentHP<=stat(a).hp*.5);if(patient){luocha.autoHealReady=luocha.turn+2;const p=params('1203','02');luochaSkillHeal(luocha,patient,p);energy(luocha,30);assist(patient,luocha);luochaFlower(luocha);record(luocha,'Автоматическое лечение → '+data.characters[patient.id].name);}}if(fu&&(fu.reversals||0)>0&&fu.currentHP<=stat(fu).hp*.5){fu.reversals--;fu.currentHP+=(stat(fu).hp-fu.currentHP)*.9;record(fu,'Фу Сюань · восстановление HP');}const blade=find('1205');if(blade&&blade.bladeCharges>=bladeChargeCap(blade))bladeFollow(blade);const l=find('1222');if(l&&fuyuan.actions>0&&!fuyuan.acting&&l.turn>=(l.emergencyReady||0)&&hpLossSerial>(l.lastHPSeen||0)&&actors.some(a=>a.currentHP<=stat(a).hp*.6)){l.emergencyReady=l.turn+2;record(l,'Фуюань · экстренное действие');fuyuanTurn(true);}if(l)l.lastHPSeen=hpLossSerial;mydeiState();settleMemories();}
    function burning(index){const d=dummies[index];return burnKeys.some(key=>d[key]&&d[key].expires>=d.turn);}
    function effectChance(actor,base,index){return clamp(base*(1+stat(actor).effectHit)*(1+(find('1006')?.s.eidolon>=2?.2:0)+(dummies[index].guiResUntil>dummies[index].turn?.1:0)+(find('1307')?.s.eidolon>=4&&dummies[index].epiphanyUntil>dummies[index].turn?.1:0))*(dummies[index].ratioDebuff>dummies[index].turn?1.1:1),0,1);}
    function luochaSkillHeal(actor,target,p){
      const atk=stat(actor).atk;
      const low=target.currentHP<stat(target).hp*.5;
      heal(target,(atk*p[0]+p[1])*(actor.s.eidolon>=2&&low?1.3:1),actor);
      if(actor.s.eidolon>=2&&!low){
        target.shield={amount:Math.max(target.shield?.amount||0,atk*.18+240),expires:target.turn+2};
        finalHealing(target,actor);
      }
    }
    function bailuSkillHeal(actor,target,amount){
      heal(target,amount,actor);
      if(actor.s.eidolon>=4){
        const previous=target.buffs.find(b=>b.key==='bailuE4'&&b.expires>=target.turn);
        const stacks=Math.min(3,(previous?.values.bailuStacks||0)+1);
        buff(target,actor.id,'bailuE4',{damage:stacks*.1,bailuStacks:stacks},2);
      }
    }
    function sparkleSkillBuff(actor,target,value,duration){
      buff(target,actor.id,'sparkleSkill',{critDamage:value},duration);
      if(actor.s.eidolon>=6)for(const ally of actors){
        if(ally!==target&&ally.buffs.some(b=>b.key==='cipher'&&b.expires>=ally.turn))
          buff(ally,actor.id,'sparkleSkill',{critDamage:value},duration);
      }
    }
    function assist(target,source){if(target!==source&&source.buffs?.some(b=>b.key==='summerGuest'&&b.expires>=source.turn)&&source.advanceSnapshot?.[target.id]!==undefined){target.distance=source.advanceSnapshot[target.id];record(source,'Особый гость · продвижение союзника запрещено');}phainonTarget(target,source);if(target.id==='1321'&&source!==target&&target.blessTurn!==target.turn){target.blessTurn=target.turn;dahliaBless();}if(G)G.assist(target);if(target.id==='1002'&&target!==source&&target.turn>=(target.danReadyTurn||0)){target.danPen=true;target.danReadyTurn=target.turn+params('1002','04')[1]-(target.s.eidolon>=2?1:0);record(target,'Превосходство досягаемости · следующая атака');}}
    function applyBurn(actor,key,targets,chance,coefficient,duration){for(const i of targets)if(rng()<effectChance(actor,chance,i)){dummies[i][key]={owner:actor.id,expires:dummies[i].turn+duration,coefficient};debuffApplied(actor);}}
    function firekiss(index){const gui=find('1210');if(!gui)return;const p=params('1210','04'),d=dummies[index];if(rng()<effectChance(gui,p[0],index)){d.firekiss=Math.min(p[5]+(gui.s.eidolon>=6?1:0),(d.firekissUntil>d.turn?d.firekiss:0)+1);d.firekissUntil=d.turn+p[4];debuffApplied(gui);record(gui,'Огненный поцелуй · '+d.firekiss+' ур.');}}
    function guiAttack(actor,targets,chance,isSkill=false){
      if(isSkill&&actor.s.eidolon>=1)for(const i of targets)if(rng()<effectChance(actor,1,i)){
        dummies[i].guiResUntil=dummies[i].turn+2;debuffApplied(actor,i);
      }
      const alreadyBurning=actor.s.eidolon>=2?targets.filter(burning):[];
      const [,,,damage,duration]=params(actor.id,'02');
      applyBurn(actor,'guiBurn',targets,chance,damage,duration);
      for(const i of alreadyBurning){
        const d=dummies[i];
        if(d.guiBurn?.expires>=d.turn)d.guiBurn.guiE2=.4;
      }
    }
    function dotHit(index,key,multiplier=1,label='Тик DoT',natural=false){const d=dummies[index],dot=d[key],actor=find(dot.owner),stacks=d.arcanaStacks||1,element={hysiWind:'Wind',hysiBurn:'Fire',hysiShock:'Thunder',hysiBleed:'Physical'}[key.replace(/E1$/,'')];hit(actor,(key==='arcana'?params('1307','04')[0]+params('1307','04')[2]*(stacks-1):dot.coefficient+(dot.guiE2||0))*multiplier,[index],label,{dot:true,element,noHysi:natural&&key==='arcana'});if((key==='guiBurn'||key==='kafkaShock')&&actor.s.eidolon>=4)energy(actor,2);if(burnKeys.includes(key)||(key==='arcana'&&d.epiphanyUntil>d.turn))firekiss(index);if(natural&&key==='arcana'){if(stacks>=3)for(const i of [index-1,index+1].filter(i=>i>=0&&i<dummies.length)){hit(actor,params('1307','04')[4],[i],'Аркан · соседний DoT',{dot:true});arcanaAdd(i);}if(d.epiphanyUntil>d.turn&&!d.epiphanyUsed)d.epiphanyUsed=true;else d.arcanaStacks=1;hysiExtra(index);}else if(natural)arcanaAdd(index);else if(find('1307')){const owner=activeActor||actor;owner.arcanaProcs??={};if((owner.arcanaProcs[index]||0)<3){owner.arcanaProcs[index]=(owner.arcanaProcs[index]||0)+1;arcanaAdd(index);}}}
    function energy(actor,amount){if(actor._memo||['1415','1506','1511'].includes(actor.id))return;if(actor.id==='1505'){evanEnergy(actor,amount*stat(actor).energyRegen);return;}const mem=memo('8007');if(mem?.active&&amount>0)memCharge(amount*stat(actor).energyRegen/1000);if(actor.id==='1408'){if(amount>0&&activeActor&&activeActor!==actor&&!form.active)phainonGain(1);return;}if(copying===actor||['1220','1308','1407'].includes(actor.id))return;const cap=data.characters[actor.id].max_sp,previous=actor.energy;actor.energy=Math.min(cap+(actor.id==='1014'?(actor.s.eidolon>=6?200:120):actor.id==='1507'?80:actor.id==='1512'&&actor.fever&&actor.s.eidolon>=6?cap:0),previous+amount*stat(actor).energyRegen);const yukong=find('1207');if(yukong?.s.eidolon>=2&&cap>0&&previous<cap&&actor.energy>=cap){yukong.yukongCredits??=new Set();if(!yukong.yukongCredits.has(actor.id)){yukong.yukongCredits.add(actor.id);energy(yukong,5);}}}
    function hit(actor,coefficient,targets,label,options={}){
      const kind=options.dot?'dot':options.kind||(options.followup?'followup':actor.actionKind),mort=find('1507'),followup=Boolean(options.followup||mort?.s.eidolon>=2&&mort.rageUntil>now&&(kind==='ultimate'||options.ultimate));
      const acheronE6=actor.id==='1308'&&actor.s.eidolon>=6;
      const ultimate=kind==='ultimate'||Boolean(options.ultimate)||(acheronE6&&['basic','skill'].includes(kind));
      if(followup&&!actor.attackTargets)beginAction(actor);
      if(G&&followup&&!options.group)G.followupStart(actor);
      const hanya=find('1215');if(hanya&&hanya.burden!==undefined&&targets.includes(hanya.burden)&&(['basic','skill','ultimate'].includes(kind)||ultimate)){const [damage,duration]=params(hanya.id,'04');buff(actor,hanya.id,'hanyaDamage',{damage:damage+(hanya.s.eidolon>=6?.1:0)},duration);}const s=options.statSnapshot||stat(actor),bonus=(options.bonus||0)+(kind==='skill'&&find('1405')?.odeAnaxaUntil>find('1405')?.turn&&data.characters[actor.id].path==='Mage'?.4:0)+(actor.id==='1510'&&ultimate&&actor.protocol==='verdict'?1:0)+(actor.id==='1413'&&options.memo&&actor.ode==='evernight'&&label.includes('Роса')?.18:0);let total=0;
      if(!options.dot&&kind!=='additional'){actor.attackTargets??=new Set();for(const i of targets)actor.attackTargets.add(i);if(followup)actor.attackFollowup=true;}
      for(const target of targets){
        const dummy=dummies[target];
        if(actor.eq?.cone?.id==='23024'&&!options.dot&&kind!=='additional'){
          dummy.mirage??={};
          if(dummy.mirage[actor.id]?.action!==actor.actionKey){
            dummy.mirage[actor.id]={action:actor.actionKey,until:dummy.turn+1};
            debuffApplied(actor,target);
          }
        }
        const gear=G?G.damage(actor,s,{kind:acheronE6&&ultimate?'ultimate':kind,followup,ultimate,dot:options.dot,element:options.element},{debuffs:debuffCount(target),mirage:dummy.mirage?.[actor.id]?.until>dummy.turn,shockOrWind:actor.eq?.cone?.id==='21022'&&['shock','wind'].some(type=>dotTypes(target).has(type)||dummy.breakStatuses?.[type]),imprisoned:scenario.imprisoned||dummy.imprisonedUntil>dummy.turn,element:data.characters[actor.id].element}):{damage:0,crit:0,critDamage:0};
        if(actor.id==='1308'&&actor.s.eidolon>=1&&debuffCount(target)>0)gear.crit+=.18;
        const panicCD=dummies[target].panicUntil>dummies[target].turn?.15:0,critical=options.fixedCritical!==undefined?options.fixedCritical+(options.fixedCritical>1?panicCD:0):options.dot?1:1+(options.guaranteedCrit?1:clamp(s.crit+gear.crit+(actor.id==='8001'&&actor.s.eidolon>=4&&maxToughness&&dummies[target].toughness===0?.25:0),0,1))*(s.critDamage+(options.extraCritDamage||0)+(kind==='skill'&&find('1412')?.merit===actor.id&&(find('1412').cCharge>=6||actor.peerageOriginal)?.72:0)+gear.critDamage+(find('1223')?.s.eidolon>=2&&find('1223').prey===target?.4:0)+(kind==='skill'&&find('1510')?.protocol==='decimation'?1:0)+(followup&&find('1309')?.concertoUntil>now?.25:0)+panicCD+(followup&&find('1504')?.8:0)+(followup?(dummies[target].topazE1||0)*.25:0)),native=(!options.element||options.element===data.characters[actor.id].element)?(actor.s.elementBonus||0):0;
        const ratioBonus=actor.id==='1305'&&debuffCount(target)>=3?Math.min(.5,debuffCount(target)*.1):0,himekoBonus=actor.id==='1003'&&(dummies[target].burn||dummies[target].himekoBurn)?.2:0;
        const guiBonus=actor.id==='1210'&&burning(target)?.2:0,danBonus=actor.id==='1002'&&kind==='basic'&&slowed(target)?.4:0,danPen=actor.id==='1002'&&actor.danPen?params('1002','04')[0]:0,d=dummies[target],vulnerability=d.firekissUntil>d.turn?d.firekiss*params('1210','04')[3]:0;
        const weltVulnerability=d.weltVulnUntil>d.turn?.12:0;
        const jiao=find('1218'),ashParams=jiao?params('1218','04'):[];
        const ashen=d.ashenBurn?.expires>=d.turn?ashParams[1]+Math.max(0,(d.ashStacks||0)-1)*ashParams[2]:0,jiaoUlt=jiao?.jiaoZoneUntil>jiao?.turn&&ultimate?params('1218','03')[2]:0,topaz=(followup&&find('1112')&&target===0?.5:0)+(followup&&find('1223')?.departed&&target===find('1223').prey?.25:0),swRes=(d.swResUntil>d.turn?(d.swResAmount||.1):0)+(d.avenResUntil>d.turn?.12:0)+(d.pelaIceUntil>d.turn&&(options.element||data.characters[actor.id].element)==='Ice'?.12:0),topazBonus=actor.id==='1112'?.15:0;
        const trib=find('1403'),hysi=d.hysiVulnUntil>d.turn?params('1410','02')[2]:0,epiphany=enemyPhase&&target===enemyIndex&&d.epiphanyUntil>d.turn?.25:0,cipher=find('1406'),tribV=trib?.tribZoneUntil>trib?.turn?.3:0,nihility=actors.filter(a=>a!==actor&&data.characters[a.id].path==='Warlock').length,abyss=actor.id==='1308'?(nihility>=(actor.s.eidolon>=2?1:2)?1.6:nihility?1.15:1):1;
        if(actor.id==='1406'&&actor.s.eidolon>=2&&rng()<effectChance(actor,1.2,target)){d.cipherE2Until=d.turn+2;debuffApplied(actor,target);}
        const damage=Math.max(0,(options.baseDamage??coefficient*(s.atk+(find('1303')?.s.eidolon>=2&&maxToughness&&d.toughness===0?actor.s.baseAtk*.4:0)))*(options.elation?1:1+s.damage+native+bonus+gear.damage+(followup&&mort?.s.eidolon>=2&&mort.rageUntil>now?.75:0)+(options.dot&&find('1005')?.s.eidolon>=2?.25:0)+(ashen&&jiao?.s.eidolon>=1?.4:0)+(actor.id==='1103'&&actor.s.eidolon>=6&&d.shock?.expires>d.turn?.3:0)+(actor.id==='1109'&&actor.s.eidolon>=6&&!options.dot&&burning(target)?.2:0)+(actor.id==='1006'&&actor.s.eidolon>=6?Math.min(1,debuffCount(target)*.2):0)+ratioBonus+himekoBonus+guiBonus+danBonus+topazBonus+(options.pelaTrace&&isExposed(target)?.2:0)+(actor.id==='1204'&&['basic','skill','ultimate'].includes(kind)&&actor.buffs.some(b=>b.key==='jingE2'&&b.expires>=actor.turn)?.2:0))*critical*defenseMultiplier(actor,target,kind,Boolean(options.memo)||/Повелитель молний|Счетовод|Фуюань|Душа дракона/.test(label),options.elation)*(1+clamp(s.resPen+danPen+swRes+eidolonEnemyRes(target,options.element||data.characters[actor.id].element)+(d.archerQuantumUntil>d.turn&&data.characters[actor.id].element==='Quantum'?.2:0)+(numby?.acting&&actor.id==='1112'&&actor.s.eidolon>=6?.1:0)+(dummies[target].luochaResUntil>dummies[target].turn?.2:0)+(ashen&&jiao?.s.eidolon>=6?d.ashStacks*.03:0)+(actor.id==='1213'&&actor.ilLeap?(actor.ilPen||0)*.2:0)+(acheronE6&&ultimate?.2:0)+(actor.id==='1220'&&actor.s.eidolon>=6&&ultimate?.2:0),0,1))*(1+sixthVulnerability(target)+(ultimate&&find('1308')?.s.eidolon>=4?.08:0)+(d.jingWeak||0)*.12+vulnerability+weltVulnerability+ashen+jiaoUlt+topaz+hysi+epiphany+tribV+(cipher?.4:0)+(d.cipherE2Until>d.turn?.3:0)+eidolonVulnerability(target)+(d.lukaVulnUntil>d.turn?params('1111','03')[2]:0)+(options.dot&&d.sampoVulnUntil>d.turn?params('1108','03')[1]:0)+(options.dot&&d.kafkaDotVulnUntil>d.turn?.3:0)+(actor.id==='1315'&&actor.duelUntil>actor.turn&&target===0?(actor.s.eidolon>=4?.42:.3):0))*abyss*(options.elation?1:options.originalMultiplier||1)*(kind==='skill'&&find('1508')?.s.eidolon>=2?1.3:1)*(actor.id==='1510'&&actor.s.eidolon>=2&&(ultimate||actor.novaActing)?1.3:1)*(options.memo&&find('1413')?.s.eidolon>=1?(dummies.length===1?1.5:dummies.length===2?1.3:dummies.length===3?1.25:1.2):1)*(actor.id==='1405'&&actor.s.eidolon>=6?1.3:1)*(options.dot&&find('1410')?.s.eidolon>=1?1.16:1)*(actor.id==='1014'&&ultimate&&actor.kingUltActive?2:1)*(maxToughness&&d.toughness>0?.9:1));actor.total+=damage;damageByTarget[target]+=damage;total+=damage;summerRecord(actor,damage);if(trib?.s.eidolon>=1&&!options.dot&&kind!=='additional')actor.tribAttackDamage=(actor.tribAttackDamage||0)+damage;if(aeon&&aha.acting)aha.instantDamage+=damage;sixthTrue(actor,damage,target,options);if(options.memo)actor.memoDamage=(actor.memoDamage||0)+damage;if(cipher&&!cipher.cipherUlting){const speed=stat(cipher).speed,mult=speed>=170?2:speed>=140?1.5:1;cipher.bank=(cipher.bank||0)+damage*((target===0?params(cipher.id,'04')[1]:.08)*mult*(cipher.s.eidolon>=1?1.5:1)+(actor===cipher&&followup&&cipher.s.eidolon>=6?.16:0));}reduceToughness(actor,target,toughnessAmount(actor,target,label,options,kind),options);}
      const mei=find('1303');if(mei?.meiUltUntil>mei?.turn)for(const i of targets)if(!dummies[i].rebloomLock)dummies[i].rebloom={owner:mei.id};if(G)G.hitEnd(actor,targets.length,followup);if(G&&followup&&!options.group)G.followupEnd(actor,actors);record(actor,label,total,options.dot?'dot':followup?'followup':'attack');if(options.dot&&!options.noHysi)for(const i of targets)hysiExtra(i);return total;
    }
    function debuffCount(index=0){const d=dummies[index];return (find('1308')?.s.eidolon>=4?1:0)+Object.values(d.mirage||{}).filter(status=>status.until>d.turn).length+(find('1223')?.departed&&find('1223').prey===index?1:0)+Object.keys(d.breakStatuses||{}).length+(d.breakSlowUntil>d.turn?1:0)+(scenario.externalDebuffs||0)+(d.exposed>d.turn?1:0)+(d.ratioDebuff>d.turn?1:0)+(d.slowUntil>d.turn?1:0)+(d.weltSlowUntil>d.turn?1:0)+(d.imprisonedUntil>d.turn?1:0)+(d.weltVulnUntil>d.turn?1:0)+(d.freeze?1:0)+(d.firekissUntil>d.turn?1:0)+(find('1112')&&index===0?1:0)+(d.topazE1?1:0)+(find('1203')?.s.eidolon>=4&&find('1203').fieldUntil>find('1203').turn?1:0)+['swAtkUntil','swDefUntil','swSpeedUntil','swUltUntil','swResUntil','panicUntil','befogUntil','epiphanyUntil','swanDefUntil','cipherWeakUntil','hysiVulnUntil','fugueDefUntil','tauntUntil','avenResUntil','pelaIceUntil','luochaResUntil','gepardSlowUntil','guiResUntil','seeleFlurryUntil','kafkaDotVulnUntil','mishaDefUntil','archerQuantumUntil','anaxaDefUntil','cipherE2Until','tbE4Until'].filter(k=>d[k]>d.turn).length+(d.sublimation?1:0)+(find('1410')?.hysiUntil>find('1410')?.turn?2:0)+dotKeys.filter(k=>d[k]&&d[k].expires>=d.turn).length;}
    function isExposed(index=0){return debuffCount(index)>0;}
    function addBlessingDamage(attacker){const ty=find('1202');if(ty?.blessing&&ty.blessing.target===attacker.id&&attacker.buffs.some(b=>b.source==='1202'&&b.key==='benediction'))hit(attacker,params('1202','02')[0]+(ty.s.eidolon>=4?.2:0),[0],'Благословение · доп. урон',{kind:'additional',element:'Thunder'});}
    function feixiaoFollow(actor){actor.followups++;if(actor.s.eidolon>=4)buff(actor,actor.id,'feixiaoE4',{speedPct:.08},2);actor.fuaSinceTurn=true;buff(actor,actor.id,'fuaDamage',{damage:params('1220','04')[4]},2);hit(actor,params('1220','04')[0]+(actor.s.eidolon>=6?1.4:0),[0],'Бонус-атака Фэйсяо',{followup:true,ultimate:actor.s.eidolon>=6,extraCritDamage:.36,toughness:actor.s.eidolon>=4?10:5});afterAttack(actor,false,'followup');}
    function ratioFollow(actor){
      actor.followups++;energy(actor,5+(actor.s.eidolon>=4?15:0));
      hit(actor,params('1305','04')[0],[0],'Бонус-атака Рацио',{followup:true,bonus:actor.s.eidolon>=6?.5:0});
      if(actor.s.eidolon>=2)for(let n=0,count=Math.min(4,debuffCount());n<count;n++)hit(actor,.2,[0],'Рацио E2 · дополнительный урон',{kind:'additional',toughness:0});
      afterAttack(actor,false,'followup');
    }
    function kafkaShock(actor,index){
      const d=dummies[index],p=params(actor.id,'03'),e6=actor.s.eidolon>=6;
      d.kafkaShock={owner:actor.id,expires:d.turn+p[2]+(e6?1:0),coefficient:p[3]+(e6?1.56:0)};
    }
    function kafkaFollow(actor){
      actor.followups++;actor.fuaReady=false;energy(actor,10);
      hit(actor,params(actor.id,'04')[0],[0],'Бонус-атака Кафки',{followup:true});
      kafkaShock(actor,0);debuffApplied(actor);
      if(actor.s.eidolon>=1&&rng()<effectChance(actor,1,0)){
        dummies[0].kafkaDotVulnUntil=dummies[0].turn+2;debuffApplied(actor,0);
        record(actor,'Кафка E1 · уязвимость к DoT');
      }
      afterAttack(actor,false,'followup');
    }
    function detonate(targets,multiplier,onlyBurn=false){for(const i of targets)for(const key of onlyBurn?[...burnKeys,...(dummies[i].epiphanyUntil>dummies[i].turn&&dummies[i].arcana?['arcana']:[])]:dotKeys){const dot=dummies[i][key];if(dot&&dot.expires>dummies[i].turn)dotHit(i,key,multiplier,onlyBurn?'Подрыв Горения':'Подрыв DoT');}for(const i of targets)breakTick(i,multiplier,false,onlyBurn?'Fire':null);}
    function heal(actor,amount,healer=actor){const owner=healer._memo?.owner||healer;const max=stat(actor).hp,before=actor.currentHP,fraction=before/max,incoming=(actor.id==='1205'&&fraction<=.5?.2:0)+(actor.id==='1507'&&actor.rageUntil>now?.5:0)+(actor.mydeiHeal||0)+(find('1407')?.s.eidolon>=4?.2:0),outgoing=(owner.eq?.p.HealRatioBase||0)+owner.buffs.reduce((sum,b)=>sum+(b.expires>=owner.turn?b.values.healing||0:0),0)+(healer.id==='1409'?Math.min(200,Math.max(0,stat(owner).speed-200))*.01+(fraction<=.5?.25:0):0)+(G?.has(owner,'320')?(stat(owner).speed>=180?.2:stat(owner).speed>=135?.12:0):0)+(healer.id==='1503'?elation(owner)*.2:0)+(healer.id==='1105'?.1:0)+(healer.id==='1105'&&fraction<=.3?.5:0)+(healer.id==='1222'?Math.min(.2,breakValue(healer)*.1):0)+(healer.id==='1110'&&healer.s.eidolon>=1&&fraction<=.5?.2:0)+(healer.id==='1301'?Math.min(.75,breakValue(healer)*.5):0)+(healer.id==='1217'&&healer.s.eidolon>=4?.8*Math.max(0,1-fraction):0),value=amount*(1+incoming)*(1+outgoing);if(healer.id==='1211'&&before+value>max)buff(actor,healer.id,'bailuHP',{hp:.1},2);actor.currentHP=Math.min(stat(actor).hp,before+value);if(actor.id==='1404'&&actor.vendetta&&actor.s.eidolon>=2&&!actor.mydeiActing){const charge=Math.max(0,Math.min(40-(actor.healCharge||0),(actor.currentHP-before)/max*40));actor.healCharge=(actor.healCharge||0)+charge;actor.mydeiCharge=Math.min(200,(actor.mydeiCharge||0)+charge);}if(actor.id==='1321'&&healer!==actor&&actor.blessTurn!==actor.turn){actor.blessTurn=actor.turn;dahliaBless();}if(actor.id==='1415'&&!actor._memo)syncDemiHP();if(healer.id==='1217'&&healer.s.eidolon>=6)buff(actor,healer.id,'huohuoE6',{damage:.5},2);recordHealing(actor,healer,value);if(G?.healing)G.healing(owner,actor);phainonTarget(actor,healer,true);if(actor.currentHP>before)record(healer,'Лечение '+(actor._memo?.name||data.characters[actor.id].name)+' · '+(actor.currentHP-before).toFixed(2)+' HP');}
    function loseHP(actor,amount,canDie=false){if(copying===actor)return;const before=actor.currentHP,lost=Math.min(amount,Math.max(0,before-(canDie?0:1)));actor.currentHP-=lost;if(actor.id==='1205'&&actor.s.eidolon>=4&&(actor.bladeE4||0)<2){const half=stat(actor).hp*.5;if(before>half&&actor.currentHP<=half){actor.bladeE4=(actor.bladeE4||0)+1;record(actor,'Блэйд E4 · макс. HP повышено');}}const fu=find('1208');if(fu?.s.eidolon>=6&&fu.matrixUntil>fu.turn&&!actor._memo)fu.matrixLoss=(fu.matrixLoss||0)+lost;if(actor.id==='1415'&&!actor._memo)syncDemiHP();if(lost>0){if(actor.id==='1507'&&actor.s.eidolon>=6&&actor.rageUntil>now&&actor.mortLossEvent!==eventSerial){actor.mortLossEvent=eventSerial;actor.mortCharge=(actor.mortCharge||0)+1;}const hy=find('1409');if(hy?.s.eidolon>=2)buff(actor,hy.id,'hyacineE2',{speedPct:.3},2);if(actor.id==='1413'){const e=find('1413');everGain(2);buff(e,e.id,'everLoss',{critDamage:.6},2);}
      if(actor.id==='1404'&&!actor.mydeiActing)actor.mydeiCharge=Math.min(200,(actor.mydeiCharge||0)+lost/stat(actor).hp*100);hpLossSerial++;actor.hpLost=Math.min(stat(actor).hp*.9,actor.hpLost+lost);actor.bladeCharges=Math.min(bladeChargeCap(actor),actor.bladeCharges+1);if(G)G.hpLoss(actor);const c=find('1407');if(c&&!form.active){c.castStacks=Math.min(3,(c.castBoostUntil>c.turn?c.castStacks||0:0)+1);c.castBoostUntil=c.turn+3;if(actor!==memo('1407').unit)castGain(lost);}const ica=memo('1409');if(ica?.active&&actor!==ica.unit){ica.hurt??=new Set();ica.hurt.add(actor);}}}
    function trainingAttack(index){
      const candidates=actors.filter(a=>!a.departed),weights=candidates.map(a=>{if(a.id==='1221'&&a.parry)return 1e9;const path=data.characters[a.id].path;let w=path==='Knight'?150:path==='Warrior'?125:['Rogue','Mage'].includes(path)?75:100;if(a.id==='1107'&&a.counterAggroUntil>a.turn)w*=6;return w;});
      let roll=rng()*weights.reduce((a,b)=>a+b,0),target=candidates[candidates.length-1];for(let i=0;i<candidates.length;i++){roll-=weights[i];if(roll<0){target=candidates[i];break;}}if(!target)return;
      record(null,'Тренировочная атака '+(index+1)+' → '+data.characters[target.id].name+' · без потери HP');energy(target,5);
      if(target.id==='1404'&&target.vendetta&&target.s.eidolon>=4)heal(target,stat(target).hp*.1);
      if(target.id==='1105'){if(target.s.eidolon>=4)energy(target,5);if(target.s.eidolon>=1&&!target.natashaE1&&target.currentHP<=stat(target).hp*.3){target.natashaE1=true;heal(target,stat(target).hp*.15+400,target);}}
      const fu=find('1208');if(fu?.s.eidolon>=4&&fu.matrixUntil>fu.turn)energy(fu,5);
      const clara=find('1107');if(clara&&(target===clara||clara.counterCharges>0||(clara.s.eidolon>=6&&rng()<.5))){if(target===clara||clara.s.eidolon>=6)dummies[index].svarogMark=true;beginAction(clara);clara.actionKind='followup';clara.followups++;const enhanced=clara.counterCharges>0,coefficient=params('1107','04')[1]+(enhanced?params('1107','03')[1]:0);if(enhanced)clara.counterCharges--;hit(clara,coefficient,[index],'Сварог · контратака',{followup:true,group:true});if(enhanced)hit(clara,coefficient*.5,[index-1,index+1].filter(i=>i>=0&&i<dummies.length),'Сварог · соседние цели',{followup:true,group:true});if(G)G.followupEnd(clara,actors);afterAttack(clara,false,'followup');}
      const march=find('1001');
      if(march&&[target.marchShield,target.shield,target.avenShield,target.trailShield,target.dragonShield].some(shield=>shield?.expires>=target.turn)&&(march.marchCounters||0)<params(march.id,'04')[1]+(march.s.eidolon>=4?1:0)){
        march.marchCounters=(march.marchCounters||0)+1;march.followups++;beginAction(march);march.actionKind='followup';energy(march,10);
        const damage=stat(march).atk*params(march.id,'04')[0]+(march.s.eidolon>=4?stat(march).def*.3:0);
        hit(march,0,[index],'Март 7 · контратака',{followup:true,baseDamage:damage,toughness:10});afterAttack(march,false,'followup');
      }
      const yunli=find('1221');if(yunli?.s.eidolon>=6&&yunli.parry&&target!==yunli)yunliCounter(yunli,true,index);
      if(target.id==='1221'){energy(target,params('1221','04')[2]);if(target.parry)yunliCounter(target,true,index);else{beginAction(target);target.actionKind='followup';target.followups++;hit(target,params('1221','04')[0],[index],'Юньли · контратака',{followup:true,group:true});hit(target,params('1221','04')[1],[index-1,index+1].filter(i=>i>=0&&i<dummies.length),'Юньли · соседние цели',{followup:true,group:true});if(G)G.followupEnd(target,actors);afterAttack(target,false,'followup');}}
    }
    function bladeChargeCap(actor){return actor.id==='1205'&&actor.s.eidolon>=6?4:5;}
    function bladeFollow(actor){if(actor.bladeCharges<bladeChargeCap(actor))return;actor.bladeCharges=0;actor.followups++;const p=params('1205','04'),s=stat(actor);hit(actor,0,dummies.map((_,i)=>i),'Бонус-атака Блэйда',{followup:true,baseDamage:s.atk*p[1]+s.hp*(p[3]+(actor.s.eidolon>=6?.5:0)),bonus:.2});heal(actor,s.hp*p[2]);energy(actor,10);afterAttack(actor,false,'followup');}
    function himekoBurn(actor,targets){for(const i of targets)if(rng()<clamp(.5*(1+stat(actor).effectHit),0,1)){dummies[i].himekoBurn={owner:actor.id,expires:dummies[i].turn+2,coefficient:.3};debuffApplied(actor);}}
    function yanqingE1(actor){const d=dummies[0];if(actor.s.eidolon>=1&&(d.freeze||d.breakFrozen))hit(actor,.6,[0],'Яньцин E1 · дополнительный урон',{kind:'additional',toughness:0});}
    function afterAttack(attacker,isUltimate=false,kind=attacker.actionKind,suppressJadeCharge=false){
      activeActor=attacker;
      const tribDamage=attacker.tribAttackDamage||0;attacker.tribAttackDamage=0;
      const targets=[...(attacker.attackTargets||new Set([0]))],wasFollow=attacker.attackFollowup||kind==='followup';attacker.attackTargets=null;attacker.attackFollowup=false;if(form.active&&attacker.id==='1408'){if(attacker.ode==='phainon')for(let n=0;n<5;n++)hit(attacker,.1,[Math.floor(rng()*dummies.length)],'Вечное горение · огонь',{kind:'additional',element:'Fire',toughness:0});cerydraAction(attacker,kind);if(G&&kind!=='memo')G.afterAttack(attacker);if(!copying)attacker.peerageOriginal=false;activeActor=null;return;}
      if(attacker.id==='8001'&&attacker.s.eidolon>=2)heal(attacker,stat(attacker).atk*.05*targets.length);
      const hy=find('1409');if(hy?.s.eidolon>=1&&hy.rainUntil>hy.turn)heal(attacker,stat(hy).hp*.08,hy);
      if(attacker.id==='1402'&&targets.some(i=>dummies[i].stitch)){if(attacker.s.eidolon>=1)energy(attacker,20);const seam=memo('1402');if(kind!=='memo'&&attacker.s.eidolon>=4&&seam?.active)seam.stacks=Math.min(7,seam.stacks+1);}
      const acheron=find('1308');
      if(acheron?.s.exEidolon&&acheron!==attacker&&acheron.exTurn!==acheron.turn&&targets.some(i=>dummies[i].knots>0)){
        acheron.exTurn=acheron.turn;
        queueFinal('acheronEX',acheron);
      }
      const seele=find('1102');if(seele?.s.eidolon>=6)for(const target of targets){const dummy=dummies[target];if(dummy.seeleFlurryUntil>dummy.turn)trueHit(seele,dummy.seeleFlurryDamage,[target],'Зеле E6 · Вихрь бабочек','additional');}
      const topazOwner=find('1112');if(topazOwner?.s.eidolon>=1&&wasFollow&&targets.includes(0))dummies[0].topazE1=Math.min(2,(dummies[0].topazE1||0)+1);
      if(attacker.id==='1106'&&attacker.s.eidolon>=6){const exposed=targets.filter(index=>isExposed(index));if(exposed.length)hit(attacker,.4,exposed,'Пела E6 · дополнительный урон',{kind:'additional',toughness:0});}
      if(attacker.eq?.cone?.id==='21029'&&['basic','skill'].includes(kind)&&targets.length){
        const target=targets.length===1?targets[0]:targets[Math.floor(rng()*targets.length)];
        hit(attacker,attacker.eq.cone.params[0],[target],'Мы ещё встретимся · дополнительный урон',{kind:'additional',toughness:0});
      }
      sixthAfterAttack(attacker,targets,kind,isUltimate,wasFollow);if(['memo','followup','elation'].includes(kind))sixthAction(attacker);
      attacker.attackMarked=attacker.actionKey;attacker.attackKindMarked=kind;if(kind!=='memo')attacker.lastHeroAttackKey=attacker.actionKey;
      yukongAction(attacker);
      const h=find('1215');if(h&&h.burden!==undefined&&targets.includes(h.burden)&&(['basic','skill','ultimate'].includes(kind)||isUltimate)){
        h.burdenHits=(h.burdenHits||0)+1;if(h.burdenHits%2===0){gainSP();h.burdenRefunds++;energy(h,2);buff(attacker,h.id,'hanyaTrace',{atk:.1},1);record(h,'Ноша · возврат SP '+h.burdenRefunds+'/2');if(h.burdenRefunds>=2)h.burden=undefined;}
      }
      if(kind==='memo'&&G?.memoryAttack)G.memoryAttack(attacker);if(kind!=='memo')cerydraAction(attacker,kind);const swan=find('1307');if(swan?.s.eidolon>=6&&attacker!==swan)for(const i of targets)arcanaAdd(i);const c=find('1412');if(kind!=='memo'&&c?.merit===attacker.id){if((c.cExtra||0)<20){c.cExtra=(c.cExtra||0)+1;hit(c,params(c.id,'04')[2]+(c.s.eidolon>=6?3:0),[targets[0]],'Керидра · дополнительный урон',{kind:'additional',element:'Wind'});}}
      const march=find('1224');if(kind!=='memo'&&march?.master===attacker.id)marchGain(march);
      const dhpt=find('1414');if(kind!=='memo'&&dhpt?.bondmate===attacker.id){energy(dhpt,6);if(dragon.active)dragon.distance=Math.max(0,dragon.distance-1500);}
      superBreak(attacker);
      const gallagher=find('1301');if(gallagher&&targets.some(i=>dummies[i].besottedUntil>dummies[i].turn)){const amount=params('1301','04')[1];for(const a of attacker===gallagher&&attacker.gallagherEnhanced?actors:[attacker])heal(a,amount,gallagher);}
      if(attacker.id==='1206'&&maxToughness&&dummies.some(d=>d.toughness===0)&&['basic','skill'].includes(kind))attacker.distance=Math.max(0,attacker.distance-1500);
      hysiApply(targets);
      const fugue=find('1225');if(hasFoxPrayer(attacker,fugue))for(const i of targets)if(rng()<effectChance(fugue,1,i)){dummies[i].fugueDefUntil=dummies[i].turn+2;debuffApplied(fugue,i);}
      const herta=find('1401');if(herta){for(const i of targets)interpret(i);const two=actors.filter(a=>data.characters[a.id].path==='Mage').length>=2;energy(herta,3*Math.min(5,Math.max(two?3:0,targets.length))/stat(herta).energyRegen);if(two){const i=targets.reduce((a,b)=>(dummies[a].interpret||0)>=(dummies[b].interpret||0)?a:b,targets[0]);interpret(i,data.characters[attacker.id].path==='Mage'?3:1);}}
      const trib=find('1403');if(trib){if(attacker!==trib)energy(trib,targets.length*1.5);if(trib.tribZoneUntil>trib.turn){const target=targets[0],baseDamage=stat(trib).hp*params(trib.id,'03')[2]*targets.length*(trib.ode==='tribbie'&&attacker===trib&&wasFollow?2:1)*(trib.s.eidolon>=2?1.2:1);for(let n=0;n<(trib.s.eidolon>=2?2:1);n++)hit(trib,0,[target],'Зона Трибби · дополнительный урон',{kind:'additional',baseDamage});if(trib.s.eidolon>=1&&attacker!==trib&&tribDamage>0)trueHit(trib,tribDamage*.24,[target],'Трибби E1 · истинный урон');}}
      if(attacker.id==='1006')silverBug(attacker);
      if(attacker.id==='1209'){const p=params(attacker.id,'04');if(kind!=='followup')yanqingE1(attacker);hit(attacker,.3,[0],'Ледяная благодать',{kind:'additional'});const s=stat(attacker),context={debuffs:debuffCount(),element:'Ice'},direct=G?G.damage(attacker,s,{kind,followup:wasFollow,ultimate:isUltimate},context).crit:0,extra=G?G.damage(attacker,s,{kind:'additional'},context).crit:0,mainHits=kind==='skill'||kind==='followup'?4:1,chance=1-Math.pow(1-clamp(s.crit+direct,0,1),mainHits)*(1-clamp(s.crit+extra,0,1));if(rng()<chance)buff(attacker,attacker.id,'yanSpeed',{speedPct:.1},2);if(kind!=='followup'&&attacker.soulUntil>=attacker.turn&&rng()<p[2]){attacker.followups++;energy(attacker,10);hit(attacker,p[3],[0],'Яньцин · бонус-атака',{followup:true});yanqingE1(attacker);if(rng()<effectChance(attacker,p[5],0)){dummies[0].freeze={owner:attacker.id,coefficient:p[4]};debuffApplied(attacker);}afterAttack(attacker,false,'followup');}}
      if(numby&&!numby.acting&&targets.includes(0)){if(wasFollow)numby.distance=Math.max(0,numby.distance-5000);if(numby.enhanced>0&&['basic','skill','ultimate'].includes(kind))numby.distance=Math.max(0,numby.distance-5000);}
      const avent=find('1304');if(avent&&attacker!==avent&&wasFollow&&attacker.avenShield?.expires>=attacker.turn&&(avent.bingo||0)<3){avent.bingo=(avent.bingo||0)+1;avent.blindBet=Math.min(10,(avent.blindBet||0)+1);avent.resource=avent.blindBet;}
      const jade=find('1314');if(jade){const debtor=jade.debtUntil>jade.turn&&(jade.debtor===attacker.id||(jade===attacker&&jade.s.eidolon>=6));if(debtor){hit(jade,params(jade.id,'02')[2],targets,'Сборщик долгов · дополнительный урон',{kind:'additional'});if(attacker!==jade)loseHP(attacker,stat(attacker).hp*.02);}if(!suppressJadeCharge&&(attacker===jade||debtor)){jade.jadeCharges=(jade.jadeCharges||0)+targets.length+(debtor&&jade.s.eidolon>=1?Math.max(0,3-targets.length):0);jade.resource=jade.jadeCharges;}}
      if(attacker.id==='1002'){attacker.danPen=false;if(rng()<.5)buff(attacker,attacker.id,'danSpeed',{speedPct:.2},2);}
      if(G&&kind!=='memo')G.afterAttack(attacker);
      const robin=find('1309');if(robin){energy(robin,params('1309','04')[1]+(robin.s.eidolon>=2?1:0));if(robin.concertoUntil>now&&attacker!==robin){const boosted=robin.s.eidolon>=6&&robin.e6Hits<8;if(boosted)robin.e6Hits++;hit(robin,params('1309','03')[3],[0],'Концерт · дополнительный урон',{kind:'additional',fixedCritical:boosted?7:2.5});}}
      const luocha=find('1203');if(luocha&&luocha.fieldUntil>luocha.turn){const atk=stat(luocha).atk;for(const a of livingAllies())heal(a,a===attacker?atk*.18+240:atk*.07+93,luocha);}
      const fx=find('1220');if(fx&&fx!==attacker&&wasFollow&&fx.s.eidolon>=2&&(fx.e2Triggers||0)<6){fx.e2Triggers=(fx.e2Triggers||0)+1;fx.resource=Math.min(12,fx.resource+1);}if(fx&&!(attacker.id==='1220'&&isUltimate)){attacks++;if(attacks%2===0)fx.resource=Math.min(12,fx.resource+1);}
      addBlessingDamage(attacker);
      const archer=find('1015');if(archer&&attacker!==archer&&archer.archerCharge>0){archer.archerCharge--;archer.resource=archer.archerCharge;archer.followups++;energy(archer,5);gainSP();hit(archer,params(archer.id,'04')[0],[0],'Арчер · бонус-атака',{followup:true,toughness:10});afterAttack(archer,false,'followup');}
      const moze=find('1223');if(moze?.departed&&targets.includes(moze.prey)&&(attacker!==moze||isUltimate)){if(moze.s.eidolon>=1)energy(moze,2);hit(moze,params(moze.id,'04')[0],[moze.prey],'Моцзэ · дополнительный урон',{kind:'additional',toughness:0});moze.mozeCharge--;moze.mozeSpent++;moze.resource=moze.mozeCharge;const follow=moze.mozeSpent%3===0;if(moze.mozeCharge<=0){moze.departed=false;moze.prey=undefined;moze.distance=8000;record(moze,'Отсутствие · окончание, продвижение 20%');}if(follow)mozeFollow(moze);}
      const dh=find('1321');if(dh?.s.eidolon>=1&&attacker.id===dh.partner&&maxToughness){for(const i of targets)if(!dummies[i].dahliaE1){dummies[i].dahliaE1=true;reduceToughness(attacker,i,clamp(maxToughness*.25,10,300)/efficiency(attacker));}superBreak(attacker);}if(dh&&attacker.id===dh.partner&&!dh.dahliaUsed){dh.dahliaUsed=true;dh.followups++;dh.actionKind='followup';beginAction(dh);if(G)G.followupStart(dh);for(let n=0;n<5+(dh.s.eidolon>=4?5:0);n++){energy(dh,2);hit(dh,params(dh.id,'04')[0],[Math.floor(rng()*dummies.length)],'Георгина · бонус-атака',{followup:true,group:true,toughness:3,superRate:2});}if(G)G.followupEnd(dh,actors);if(dh.s.eidolon>=4)for(const d of dummies)d.dahliaVulnUntil=d.turn+2;if(dh.s.eidolon>=6)attacker.distance=Math.max(0,attacker.distance-2000);dh.dahliaFuas=(dh.dahliaFuas||0)+1;if(dh.dahliaFuas%2===1)gainSP();afterAttack(dh,false,'followup');}
      const x=find('1214'),karmaCap=x?.s.eidolon>=6?6:8;if(x&&x.karma>=karmaCap&&!x.xueyiActing){x.xueyiActing=true;x.karma=Math.min(6,x.karma-karmaCap);x.followups++;beginAction(x);if(G)G.followupStart(x);for(let n=0;n<3;n++)hit(x,params(x.id,'04')[1],[Math.floor(rng()*dummies.length)],'Сюэи · бонус-атака',{followup:true,group:true,toughness:5,bonus:x.s.eidolon>=1?.4:0});if(x.s.eidolon>=2)heal(x,stat(x).hp*.05);energy(x,6);if(G)G.followupEnd(x,actors);afterAttack(x,false,'followup');x.xueyiActing=false;}
      const hm=find('1003');if(hm&&hm.himekoCharges>=3&&!hm.himekoActing){hm.himekoActing=true;hm.himekoCharges-=3;hm.followups++;beginAction(hm);if(hm.s.eidolon>=1)buff(hm,hm.id,'himekoE1',{speedPct:.2},2);hit(hm,params('1003','04')[0],allTargets(),'Химеко · бонус-атака',{followup:true,toughness:10});energy(hm,10);afterAttack(hm,false,'followup');hm.himekoActing=false;}
      if(fx&&attacker!==fx&&fx.fuaReady){fx.fuaReady=false;feixiaoFollow(fx);}
      const kafka=find('1005');if(kafka&&attacker!==kafka&&kind==='basic'&&kafka.fuaReady)kafkaFollow(kafka);
      const ratio=find('1305');if(ratio&&attacker!==ratio&&ratio.ratioMarks>0){ratio.ratioMarks--;ratioFollow(ratio);}
      if(avent)aventFollow(avent);if(jade)jadeFollow(jade);const cipher=find('1406');if(cipher?.s.eidolon>=4&&attacker!==cipher&&targets.includes(0))hit(cipher,.5,[0],'Цифер E4 · дополнительный урон',{kind:'additional',toughness:0});if(cipher&&attacker!==cipher&&targets.includes(0)&&!cipher.cipherUsed){cipher.cipherUsed=true;cipher.followups++;energy(cipher,5);if(cipher.s.eidolon>=1)buff(cipher,cipher.id,'cipherE1',{atk:.8},2);hit(cipher,params(cipher.id,'04')[0],[0],'Цифер · бонус-атака',{followup:true,extraCritDamage:1,bonus:cipher.s.eidolon>=6?3.5:0});afterAttack(cipher,false,'followup');}settleHP();if(!copying)attacker.peerageOriginal=false;
      if(march?.s.eidolon>=2&&march.master===attacker.id&&['basic','skill'].includes(kind)&&march.marchE2Turn!==march.turn){march.marchE2Turn=march.turn;marchFollow(march,attacker,targets[0]??0);}
      const bronya=find('1101');if(bronya?.s.eidolon>=4&&attacker!==bronya&&kind==='basic'&&bronya.e4Turn!==bronya.turn&&targets.length){bronya.e4Turn=bronya.turn;beginAction(bronya);bronya.followups++;hit(bronya,params('1101','01')[0]*.8,[targets[0]],'Броня E4 · бонус-атака',{followup:true});afterAttack(bronya,false,'followup');}
      activeActor=null;
    }
    function servalTalent(actor){const targets=dummies.map((d,i)=>d.shock&&d.shock.expires>d.turn?i:-1).filter(i=>i>=0);if(targets.length){hit(actor,params('1103','04')[0],targets,'Талант Сервал');if(actor.s.eidolon>=2)energy(actor,4);}}
    function ult(actor){
      beginAction(actor);
      actor.ultimateKey=actor.actionKey;if(['1415','1506'].includes(actor.id)){actor.ults++;finalUlt(actor);return;}if(actor.id==='1014'){actor.kingUltActive=actor.kingUlt;actor.kingUlt=false;}const p=params(actor.id,'03'),all=dummies.map((_,i)=>i);actor.ults++;
      if(actor===aeon){aeonUlt(actor);return;}
      if(actor.id==='1308'){actor.resource-=9;actor.acheronUlting=true;for(let n=0;n<3;n++){const i=all.reduce((a,b)=>(dummies[a].knots||0)>=(dummies[b].knots||0)?a:b,0),removed=Math.min(3,dummies[i].knots||0);if(removed){actor.acheronStacks=Math.min(3,(actor.acheronStacks||0)+1);buff(actor,actor.id,'thunderCore',{damage:actor.acheronStacks*.3},3);}dummies[i].knots-=removed;hit(actor,p[0],[i],'Клинок дождя');if(removed)hit(actor,p[1]*(removed+1),all,'Клинок дождя · узлы');}hit(actor,p[2],all,'Стигийское возрождение');for(let n=0;n<6;n++)hit(actor,.25,[Math.floor(rng()*dummies.length)],'Ядро грома · дополнительный удар');for(const d of dummies)d.knots=0;afterAttack(actor,true);actor.acheronUlting=false;return;}
      if(actor.id==='1221'){actor.energy-=120;energy(actor,5);actor.parry=true;actor.parryAt=eventSerial;for(const d of dummies)d.tauntUntil=d.turn+1;debuffApplied(actor);record(actor,'Юньли · Блок');return;}
      if(actor.id==='1220')huohuoHeal(actor);
      if(actor.id==='1220'){
        actor.resource-=6;
        if(G)G.followupStart(actor);
        for(let i=0;i<p[2];i++){
          const unbroken=dummies[0].toughness>0;
          const strike=data.character_skills[unbroken?'122009':'122008'].params[actor.s.eidolon>=3?11:9];
          hit(actor,strike[0]+strike[1],[0],'Ульта Фэйсяо · удар',{
            extraCritDamage:.36,followup:true,ultimate:true,group:true,toughness:unbroken?10:5,originalMultiplier:actor.s.eidolon>=1?1+Math.min(5,i)*.1:1
          });
        }
        hit(actor,p[0],[0],'Ульта Фэйсяо · завершение',{extraCritDamage:.36,followup:true,ultimate:true,group:true,toughness:0,originalMultiplier:actor.s.eidolon>=1?1.5:1});
        if(G)G.followupEnd(actor,actors);
        afterAttack(actor,true);
        return;
      }
      actor.energy=actor.id==='1014'?Math.max(0,actor.energy-360):(actor.id==='1507'||actor.id==='1512'&&actor.fever&&actor.s.eidolon>=6)?Math.max(0,actor.energy-data.characters[actor.id].max_sp):0;energy(actor,5);huohuoHeal(actor);
      if(finalUlt(actor)||sixthUlt(actor)||fifthUlt(actor)||batchUlt(actor)||breakUlt(actor))return;
      if(actor.id==='1222'){for(const d of dummies)d.befogUntil=d.turn+p[4];debuffApplied(actor);if(actor.s.eidolon>=2)for(const a of actors)buff(a,actor.id,'lingshaE2',{breakEffect:.4},3);hit(actor,p[0],all,'Ульта Линша');for(const a of livingAllies())heal(a,stat(actor).atk*p[1]+p[2],actor);if(fuyuan.actions>0)fuyuan.distance=0;afterAttack(actor,true);}
      else if(actor.id==='1225'){hit(actor,p[0],all,'Ульта Фуги');if(actor.s.eidolon>=2)for(const ally of actors)ally.distance=Math.max(0,ally.distance-2400);afterAttack(actor,true);}
      else if(actor.id==='1307'){for(const d of dummies){d.epiphanyUntil=d.turn+2;d.epiphanyUsed=false;d.swanEnergyUsed=false;}debuffApplied(actor);hit(actor,p[0],all,'Ульта Чёрного Лебедя');afterAttack(actor,true);}
      else if(actor.id==='1401'){const sorted=dummies.map(d=>d.interpret||1).sort((a,b)=>b-a);all.forEach(i=>dummies[i].interpret=sorted[i]);hit(actor,p[0]+(actor.answers||0)*.01+(actor.s.eidolon>=6?(all.length===1?4:all.length===2?2.5:1.4):0),all,'Ульта Великой Герты');buff(actor,actor.id,'hertaUlt',{atk:.8},3);actor.inspiration=Math.min(4,(actor.inspiration||0)+(actor.s.eidolon>=2?2:1));actor.distance=0;afterAttack(actor,true);}
      else if(actor.id==='1403'){const before=stat(actor).hp;actor.tribZoneUntil=actor.turn+2;actor.currentHP+=Math.max(0,stat(actor).hp-before);actor.tribSeen=new Set();hit(actor,0,all,'Ульта Трибби',{baseDamage:stat(actor).hp*p[0]});afterAttack(actor,true);}
      else if(actor.id==='1405'){for(const d of dummies)d.sublimation=true;debuffApplied(actor);hit(actor,p[0],all,'Ульта Анаксы',{bonus:.3});afterAttack(actor,true);}
      else if(actor.id==='1406'){const bank=actor.bank||0;actor.bank=actor.s.eidolon>=6?bank*.2:0;actor.cipherUlting=true;record(actor,'Цифер · запись '+bank);hit(actor,p[0],[0],'Ульта Цифер · первый удар');trueHit(actor,bank*.25,[0],'Цифер · истинный урон 25%');hit(actor,p[3],all.slice(0,3),'Ульта Цифер · взрыв');trueHit(actor,bank*.75,all.slice(0,3),'Цифер · истинный урон 75%');actor.cipherUlting=false;afterAttack(actor,true);}
      else if(actor.id==='1410'){actor.hysiUntil=actor.turn+3;gainSP();debuffApplied(actor);hit(actor,p[0],all,'Ульта Гисиленсы');detonate(all,1.5);afterAttack(actor,true);}
      else if(actor.id==='1006'){if(rng()<effectChance(actor,p[1],0)){dummies[0].swUltUntil=dummies[0].turn+p[3];debuffApplied(actor);}hit(actor,p[0],[0],'Ульта Серебряного Волка');const count=Math.min(5,debuffCount());if(actor.s.eidolon>=1)energy(actor,7*count);if(actor.s.eidolon>=4&&count)hit(actor,.2*count,[0],'Серебряный Волк E4 · дополнительный урон',{kind:'additional',toughness:0});afterAttack(actor,true);}
      else if(actor.id==='1107'){actor.counterCharges=p[4]+(actor.s.eidolon>=6?1:0);if(actor.s.eidolon>=2)buff(actor,actor.id,'claraE2',{atk:.3},2);actor.counterAggroUntil=actor.turn+p[2];record(actor,'Клара · усиление контратаки');}
      else if(actor.id==='1112'){numby.enhanced=p[3]+(actor.s.eidolon>=6?1:0);record(actor,'Счетовод · Поразительный рост');}
      else if(actor.id==='1209'){buff(actor,actor.id,'yanUlt',{crit:p[0],critDamage:actor.soulUntil>=actor.turn?p[1]:0},1);hit(actor,p[2],[0],'Ульта Яньцина');afterAttack(actor,true);}
      else if(actor.id==='1213'){ilHits(actor,[.3,.3,.4],p[0],p[1],false,true);actor.squama=Math.min(p[3]+(actor.s.exEidolon?1:0),(actor.squama||0)+p[2]+(actor.s.eidolon>=2?1:0));if(actor.s.eidolon>=2)actor.distance=0;actor.resource=actor.squama;afterAttack(actor,true);}
      else if(actor.id==='1217'){for(const a of actors)if(a!==actor){energy(a,data.characters[a.id].max_sp*p[0]/stat(a).energyRegen);buff(a,actor.id,'huohuoUlt',{atk:p[1]},p[2]);assist(a,actor);}record(actor,'Хохо · энергия и ATK команды');}
      else if(actor.id==='1218'){const max=Math.max(0,...dummies.map(d=>d.ashenBurn?d.ashStacks||0:0));for(const d of dummies)if(max){d.ashStacks=max;d.ashenBurn={owner:actor.id,expires:d.turn+2,coefficient:params('1218','04')[5]+(actor.s.eidolon>=2?3:0)};}actor.jiaoZoneUntil=actor.turn+p[3];actor.jiaoTriggers=0;hit(actor,p[0],all,'Ульта Цзяоцю');ash(actor,all);afterAttack(actor,true);}
      else if(actor.id==='1304'){actor.blindBet=Math.min(10,(actor.blindBet||0)+1+Math.floor(rng()*p[0]));actor.resource=actor.blindBet;dummies[0].panicUntil=dummies[0].turn+p[3];debuffApplied(actor);hit(actor,0,[0],'Ульта Авантюрина',{baseDamage:stat(actor).def*p[1]});if(actor.s.eidolon>=1)aventShield(actor,...params('1304','02').slice(0,2));afterAttack(actor,true);}
      else if(actor.id==='1313'){const target=focusFor(actor);actor.beatified=target.id;actor.beatifiedUntil=actor.turn+p[2];actor.beatifiedCD=stat(actor).critDamage*p[1]+p[3];if(actor.s.eidolon>=2&&actor.ults===1){gainSP();gainSP();}if(actor.s.eidolon>=6)sundayCrit(target,actor);energy(target,Math.max(40,data.characters[target.id].max_sp*p[0])/stat(target).energyRegen);assist(target,actor);record(actor,'Блаженный → '+data.characters[target.id].name);}
      else if(actor.id==='1314'){if(actor.s.eidolon>=4)buff(actor,actor.id,'jadeE4',{},3);hit(actor,p[2],all,'Ульта Яшмы');actor.jadeEnhanced=p[1];afterAttack(actor,true);}
      else if(actor.id==='1004'){hit(actor,p[0],all,'Ульта Вельта',{bonus:!maxToughness||dummies.every(d=>d.toughness===0)?.2:0});weltTalent(actor,all);for(const i of all){const d=dummies[i];if(rng()<effectChance(actor,p[2],i)){d.imprisonedUntil=d.turn+1;d.distance+=10000*p[1];debuffApplied(actor);}if(rng()<effectChance(actor,1,i)){d.weltVulnUntil=d.turn+2;debuffApplied(actor);}}energy(actor,10);if(actor.s.eidolon>=1)actor.weltEcho=2;afterAttack(actor,true);}
      else if(actor.id==='1302'){const q=data.character_skills['130214'].params[actor.s.eidolon>=5?11:9];if(actor.s.eidolon>=2&&all.length>=3)buff(actor,actor.id,'argentiE2',{atk:.4},1);hit(actor,q[0],all,'Аргенти · полная ульта');argentiTalent(actor,all.length);for(let i=0;i<q[1];i++){hit(actor,q[2],[Math.floor(rng()*dummies.length)],'Аргенти · отскок ульты');argentiTalent(actor,1);}afterAttack(actor,true);}
      else if(actor.id==='1212'){jingliuE1(actor);const enhanced=actor.transmigration,s=jingliuSnapshot(actor);hit(actor,p[0],[0],'Ульта Цзинлю',{statSnapshot:s,bonus:enhanced?.2:0});if(all.length>1)hit(actor,p[2],all.slice(1,3),'Ульта Цзинлю · соседние цели',{statSnapshot:s,bonus:enhanced?.2:0});jingliuSingleTarget(actor,s);if(actor.s.eidolon>=2)actor.jingliuE2=true;jingliuGain(actor,p[1]);afterAttack(actor,true);settleHP();}
      else if(actor.id==='1303'){actor.meiUltUntil=actor.turn+p[1]+(actor.s.eidolon>=6?1:0);for(const a of actors)assist(a,actor);record(actor,'Зона Жуань Мэй · пробитие RES');}
      else if(actor.id==='1309'){actor.e6Hits=0;actor.concertoATK=stat(actor).atk*p[0]+p[2];actor.concertoUntil=now+10000/p[1];for(const a of actors){if(a!==actor)a.distance=0;assist(a,actor);}record(actor,'Концерт · продвижение команды и отсчёт SPD 90');}
      else if(actor.id==='1306'){const recovered=p[1]+(actor.s.eidolon>=4?1:0);gainSP(recovered);for(const a of actors){buff(a,actor.id,'cipher',{cipher:1},p[3]+(actor.s.eidolon>=1?1:0));assist(a,actor);}if(actor.s.eidolon>=6){const donor=actors.find(a=>a.buffs.some(b=>b.key==='sparkleSkill'&&b.expires>=a.turn));const shared=donor?.buffs.find(b=>b.key==='sparkleSkill'&&b.expires>=donor.turn);if(shared)sparkleSkillBuff(actor,donor,shared.values.critDamage,Math.max(1,shared.expires-donor.turn));}record(actor,'Искорка · +'+recovered+' SP и Шифр');}
      else if(actor.id==='1203'){hit(actor,p[0],all,'Ульта Лочи');if(actor.s.eidolon>=6){for(const d of dummies)d.luochaResUntil=d.turn+2;debuffApplied(actor);}luochaFlower(actor);afterAttack(actor,true);}
      else if(actor.id==='1211'){if(actor.s.eidolon>=2)buff(actor,actor.id,'bailuE2',{healing:.15},2);for(const a of actors){a.vigorUntil=a.turn+p[2];heal(a,stat(actor).hp*p[0]+p[1],actor);assist(a,actor);}record(actor,'Ульта Байлу · лечение и Бодрость');}
      else if(actor.id==='1104'){const shield=(stat(actor).def*p[0]+p[2])*(G?.has(actor,'103',4)?1.2:1);for(const a of actors){a.shield={amount:shield,expires:a.turn+p[1]};finalHealing(a,actor);assist(a,actor);}record(actor,'Щит Гепарда · '+shield.toFixed(2));}
      else if(actor.id==='1208'){hit(actor,0,all,'Ульта Фу Сюань',{baseDamage:stat(actor).hp*p[0]+(actor.s.eidolon>=6?2*Math.min(actor.matrixLoss||0,stat(actor).hp*1.2):0)});actor.matrixLoss=0;actor.reversals=Math.min(2,(actor.reversals||0)+1);for(const a of actors)if(a!==actor){heal(a,stat(actor).hp*.05+133,actor);assist(a,actor);}afterAttack(actor,true);settleHP();}
      else if(actor.id==='1101'){const cd=stat(actor).critDamage;for(const target of actors){buff(target,actor.id,'bronyaUlt',{atk:p[0],critDamage:p[1]*cd+p[2]},p[3]);assist(target,actor);}record(actor,'Ульта Брони · баф команды');}
      else if(actor.id==='1202'){const target=focusFor(actor);energy(target,(p[0]+(actor.s.eidolon>=6?10:0))/stat(target).energyRegen);buff(target,actor.id,'tingyunUlt',{damage:p[2]},p[1]);assist(target,actor);record(actor,'Ульта Тинъюнь → '+data.characters[target.id].name);}
      else if(actor.id==='1009'){if(actor.s.eidolon>=2)actor.keepCharges=true;for(const target of actors){buff(target,actor.id,'astaUlt',{speed:p[0]},p[1]);assist(target,actor);}record(actor,'Ульта Асты · скорость');}
      else if(actor.id==='1106'){hit(actor,p[3],all,'Ульта Пелы',{pelaTrace:true});for(const d of dummies)d.exposed=d.turn+p[2];debuffApplied(actor);energy(actor,params('1106','04')[0]);record(actor,'Ослабление DEF');afterAttack(actor,true);}
      else if(actor.id==='1102'){buff(actor,actor.id,'seeleBoost',{damage:params('1102','04')[0],resPen:.2},1);const damage=hit(actor,p[0],[0],'Ульта Зеле');afterAttack(actor,true);if(actor.s.eidolon>=6){dummies[0].seeleFlurryUntil=dummies[0].turn+1;dummies[0].seeleFlurryDamage=damage*.15;debuffApplied(actor);}}
      else if(actor.id==='1103'){hit(actor,p[0],all,'Ульта Сервал');for(const [i,d] of dummies.entries()){if(d.shock)d.shock.expires+=p[1];else if(actor.s.eidolon>=4&&rng()<effectChance(actor,1,i)){const skill=params('1103','02');d.shock={owner:actor.id,expires:d.turn+skill[3],coefficient:skill[4]};debuffApplied(actor,i);}}servalTalent(actor);afterAttack(actor,true);}
      else if(actor.id==='1013'){hit(actor,p[0],all,'Ульта Герты');if(actor.s.eidolon>=6)buff(actor,actor.id,'hertaE6',{atk:.25},1);afterAttack(actor,true);}
      else if(actor.id==='1003'){hit(actor,p[0],all,'Ульта Химеко');if(actor.s.eidolon>=6)for(let n=0;n<2;n++)hit(actor,p[0]*.4,[Math.floor(rng()*all.length)],'Химеко E6 · отскок',{toughness:0});himekoBurn(actor,all);afterAttack(actor,true);}
      else if(actor.id==='1005'){hit(actor,p[0],all,'Ульта Кафки');for(const i of all)kafkaShock(actor,i);debuffApplied(actor);detonate(all,p[4]);afterAttack(actor,true);}
      else if(actor.id==='1204'){hit(actor,p[0],all,'Ульта Цзин Юаня');lordAdd(actor,p[1],12);afterAttack(actor,true);}
      else if(actor.id==='1305'){hit(actor,p[0],[0],'Ульта Рацио');actor.ratioMarks=p[1]+(actor.s.eidolon>=6?1:0);afterAttack(actor,true);}
      else if(actor.id==='1205'){const s=stat(actor),next=s.hp*.5;if(actor.currentHP>next)loseHP(actor,actor.currentHP-next);else actor.currentHP=next;const lost=actor.hpLost;hit(actor,0,[0],'Ульта Блэйда',{baseDamage:s.atk*p[0]+s.hp*p[1]+lost*(p[4]+(actor.s.eidolon>=1?1.5:0))});if(all.length>1)hit(actor,0,all.slice(1,3),'Ульта Блэйда · соседние цели',{baseDamage:s.atk*p[2]+s.hp*p[3]+lost*p[5]});actor.hpLost=0;afterAttack(actor,true);bladeFollow(actor);}
      else if(actor.id==='1002'){hit(actor,p[0]+(slowed(0)?p[1]:0),[0],'Ульта Дань Хэна');afterAttack(actor,true);}
      else if(actor.id==='1109'){hit(actor,p[0],[0],'Ульта Хук');hookTalent(actor,[0]);actor.hookEnhanced=true;actor.distance=Math.max(0,actor.distance-2000);energy(actor,5);afterAttack(actor,true);}
      else if(actor.id==='1210'){hit(actor,p[0],all,'Ульта Гуйнайфэнь');detonate(all,p[1],true);afterAttack(actor,true);}
      else if(actor.id==='1105'){for(const a of actors){const low=a.currentHP<=stat(a).hp*.3;heal(a,stat(actor).hp*p[0]+p[1],actor);if(low&&actor.s.eidolon>=2)a.natashaE2=actor.id;assist(a,actor);}record(actor,'Ульта Наташи · лечение');}
    }
    function runUlts(){
      settleFinal();if(form.active)return;
      let fired=true,guard=0;
      while(fired&&guard++<100){fired=false;for(const actor of [...actors].sort((a,b)=>(models[b.id].role==='support')-(models[a.id].role==='support'))){if(form.active)break;if(actor.id==='1507'&&actor.rageUntil>now&&actor.energy<data.characters[actor.id].max_sp)continue;if(actor.id==='1310'&&actor.combustionUntil>now)continue;if(actor.id==='1317'&&actor.ink>0)continue;if(actor.id==='1221'&&actor.parry)continue;if(['1313','1512'].includes(actor.id)&&actors.length===1)continue;if(actor.id==='1309'&&actor.concertoUntil>now)continue;if(actor.id==='1105'&&actors.every(a=>a.currentHP>=stat(a).hp*.7))continue;const ready=actor===aeon?actor.resource>=8:actor.id==='1415'?actor.resource>=(actor.ripple?12:24):actor.id==='1506'?actor.resource>=60&&!actor.godmode:actor.id==='1407'?actor.resource>=34000&&!memo('1407').active:actor.id==='1408'?actor.resource>=12:actor.id==='1220'?actor.resource>=6:actor.id==='1308'?actor.resource>=9:actor.energy+1e-8>=(actor.id==='1221'?120:data.characters[actor.id].max_sp);if(ready){const previous=actor.actionKind;actor.actionKind='ultimate';if(G)G.beforeUltimate(actor);ult(actor);if(G)G.afterUltimate(actor);afterUlt(actor);actor.actionKind=previous;fired=true;}}}
      if(guard>=100)throw Error('Защита от бесконечной цепочки ульт.');
    }
    function castRegularSkill(actor){const target=focusFor(actor),p=params(actor.id,'02');
if(G&&actor.id!=='1405')G.beforeSkill(actor);if(!['1205','1405'].includes(actor.id))energy(actor,actor.id==='1212'?20:30);
        if(actor.id==='1221'){heal(actor,stat(actor).atk*p[2]+p[3]);hit(actor,p[0],[0],'Навык Юньли');if(dummies.length>1)hit(actor,p[1],allTargets().slice(1,3),'Навык Юньли · соседние цели');afterAttack(actor);}
        else if(actor.id==='1222'){hit(actor,p[0],allTargets(),'Навык Линша');for(const a of livingAllies())heal(a,stat(actor).atk*p[1]+p[2],actor);if(!fuyuan.actions)fuyuan.distance=10000;fuyuan.actions=Math.min(5,fuyuan.actions+3);actor.fuyuanActive=true;actor.lastHPSeen=hpLossSerial;fuyuan.distance=Math.max(0,fuyuan.distance-2000);afterAttack(actor);}
        else if(actor.id==='1225'){actor.fugueUntil=actor.turn+3;actor.prayer=target.id;if(!actor.fugueFirst){actor.fugueFirst=true;gainSP();}assist(target,actor);record(actor,'Фуга · Молитва лисы');}
        else if(actor.id==='1307'){const ts=allTargets().slice(0,3);hit(actor,p[0],ts,'Навык Чёрного Лебедя');for(const i of ts){const types=dotTypes(i);arcanaAdd(i,1);for(const t of types)arcanaAdd(i);if(rng()<effectChance(actor,1,i)){dummies[i].swanDefUntil=dummies[i].turn+3;debuffApplied(actor,i);}}afterAttack(actor);}
        else if(actor.id==='1308'){acheronGain(p[2]);hit(actor,p[0],[0],'Навык Ахерон');if(dummies.length>1)hit(actor,p[1],allTargets().slice(1,3),'Навык Ахерон · соседние цели');afterAttack(actor);}
        else if(actor.id==='1401')hertaSkill(actor);
        else if(actor.id==='1403'){actor.sanctifyUntil=actor.turn+p[1];for(const a of actors)assist(a,actor);record(actor,'Трибби · Освящение');}
        else if(actor.id==='1405'){anaxaSkill(actor);anaxaSkill(actor);}
        else if(actor.id==='1406'){let applied=false;for(const i of allTargets().slice(0,3))if(rng()<effectChance(actor,1.2,i)){dummies[i].cipherWeakUntil=dummies[i].turn+2;debuffApplied(actor,i);applied=true;}if(applied)buff(actor,actor.id,'cipherAtk',{atk:.3},2);hit(actor,p[0],[0],'Навык Цифер');if(dummies.length>1)hit(actor,p[1],allTargets().slice(1,3),'Навык Цифер · соседние цели');afterAttack(actor);}
        else if(actor.id==='1410'){for(const i of allTargets())if(rng()<effectChance(actor,1,i)){dummies[i].hysiVulnUntil=dummies[i].turn+3;debuffApplied(actor,i);}hit(actor,p[0],allTargets(),'Навык Гисиленсы');afterAttack(actor);}
        else if(actor.id==='1006'){const many=debuffCount()>=3;if(rng()<effectChance(actor,p[4],0)){dummies[0].swResUntil=dummies[0].turn+p[6];dummies[0].swResAmount=p[5]+(many?.03:0);debuffApplied(actor);}hit(actor,p[0],[0],'Навык Серебряного Волка');afterAttack(actor);}
        else if(actor.id==='1107'){hit(actor,p[0],allTargets(),'Навык Клары');const marked=allTargets().filter(i=>dummies[i].svarogMark);if(marked.length)hit(actor,p[1],marked,'Метка Сварога · навык');if(!(actor.s.eidolon>=1))for(const d of dummies)d.svarogMark=false;afterAttack(actor);}
        else if(actor.id==='1112'){actor.followups++;hit(actor,p[0],[0],'Навык Топаз',{followup:true});afterAttack(actor);}
        else if(actor.id==='1209'){actor.soulUntil=actor.turn+1;hit(actor,p[0],[0],'Навык Яньцина');afterAttack(actor);}
        else if(actor.id==='1217'){const patient=[...actors].sort((a,b)=>a.currentHP/stat(a).hp-b.currentHP/stat(b).hp)[0],i=actors.indexOf(patient);heal(patient,stat(actor).hp*p[0]+p[1],actor);assist(patient,actor);for(const n of [i-1,i+1].filter(n=>n>=0&&n<actors.length)){heal(actors[n],stat(actor).hp*p[2]+p[3],actor);assist(actors[n],actor);}actor.divineUntil=actor.turn+2+(actor.s.eidolon>=1?1:0);record(actor,'Хохо · Жертвенность жизни');}
        else if(actor.id==='1218'){hit(actor,p[0],[0],'Навык Цзяоцю');if(dummies.length>1)hit(actor,p[1],allTargets().slice(1,3),'Навык Цзяоцю · соседние цели');ash(actor,allTargets().slice(0,3));ash(actor,[0],p[2],false);afterAttack(actor);}
        else if(actor.id==='1304'){aventShield(actor,p[0],p[1]);for(const a of actors)assist(a,actor);}
        else if(actor.id==='1313'){const summoned=Boolean(memo(target.id)?.active)||target.id==='1204'||target.id==='1112'||(target.id==='1222'&&fuyuan.actions>0)||(target.id==='1414'&&dragon.active);buff(target,actor.id,'sundaySkill',{damage:p[1]+(summoned?p[3]:0)},p[2]);sundayCrit(target,actor);if(actor.s.eidolon>=1)buff(target,actor.id,'sundayDef',{},2);if(data.characters[target.id].path!=='Shaman'&&target!==actor&&!actor.buffs.some(b=>b.key==='summerGuest'&&b.expires>=actor.turn)){target.distance=0;if(target.id==='1204'&&lord)lord.distance=0;if(target.id==='1112'&&numby)numby.distance=0;if(target.id==='1222'&&fuyuan.actions>0)fuyuan.distance=0;if(target.id==='1414'&&dragon.active)dragon.distance=0;const spirit=memo(target.id);if(spirit?.active&&memoSpeed(spirit)>0)spirit.distance=0;}if(actor.beatified===target.id&&actor.beatifiedUntil>actor.turn)gainSP();assist(target,actor);record(actor,'Воскресенье · продвижение → '+data.characters[target.id].name);}
        else if(actor.id==='1314'){actor.debtor=target.id;actor.debtUntil=actor.turn+p[3];if(target!==actor)buff(target,actor.id,'debtSpeed',{speed:p[0]},100000);assist(target,actor);record(actor,'Сборщик долгов → '+data.characters[target.id].name);}
        else if(actor.id==='1004'){const echo=actor.weltEcho>0;if(echo)actor.weltEcho--;for(let n=0;n<3+(actor.s.eidolon>=6?1:0);n++){const i=n?Math.floor(rng()*dummies.length):0;hit(actor,p[0],[i],'Навык Вельта · попадание',{bonus:!maxToughness||dummies[i].toughness===0?.2:0});if(rng()<effectChance(actor,p[1]+(actor.s.eidolon>=4?.35:0),i)){dummies[i].weltSlowUntil=dummies[i].turn+p[3];debuffApplied(actor);}weltTalent(actor,[i]);if(echo)hit(actor,p[0]*.8,[i],'Вельт E1 · дополнительный урон',{kind:'additional',toughness:0});}afterAttack(actor);}
        else if(actor.id==='1302'){hit(actor,p[0],allTargets(),'Навык Аргенти');argentiTalent(actor,dummies.length);afterAttack(actor);}
        else if(actor.id==='1212'){hit(actor,p[0],[0],'Непостижимая Зарница');jingliuGain(actor,p[1]);if(!actor.transmigration)actor.distance=Math.max(0,actor.distance-1000);afterAttack(actor);}
        else if(actor.id==='1303'){actor.meiSkillUntil=actor.turn+p[2];for(const a of actors)assist(a,actor);record(actor,'Обертон Жуань Мэй · баф урона');}
        else if(actor.id==='1309'){actor.robinSkillUntil=actor.turn+p[1];energy(actor,5);for(const a of actors)assist(a,actor);record(actor,'Навык Зарянки · баф урона');}
        else if(actor.id==='1306'){sparkleSkillBuff(actor,target,stat(actor).critDamage*(p[0]+(actor.s.eidolon>=6?.3:0))+p[1],target===actor?1:2);if(target!==actor)target.distance=Math.max(0,target.distance-10000*p[3]);assist(target,actor);record(actor,'Навык Искорки → '+data.characters[target.id].name);}
        else if(actor.id==='1203'){const patient=[...actors].sort((a,b)=>a.currentHP/stat(a).hp-b.currentHP/stat(b).hp)[0];luochaSkillHeal(actor,patient,p);assist(patient,actor);luochaFlower(actor);record(actor,'Навык Лочи → '+data.characters[patient.id].name);}
        else if(actor.id==='1211'){const patient=[...actors].sort((a,b)=>a.currentHP/stat(a).hp-b.currentHP/stat(b).hp)[0],amount=stat(actor).hp*p[0]+p[1];bailuSkillHeal(actor,patient,amount);assist(patient,actor);for(let n=1;n<=p[3];n++){const other=actors[Math.floor(rng()*actors.length)];bailuSkillHeal(actor,other,amount*Math.pow(1-p[2],n));assist(other,actor);}record(actor,'Навык Байлу · лечение с отскоками');}
        else if(actor.id==='1104'){hit(actor,p[0],[0],'Навык Гепарда');if(rng()<effectChance(actor,p[1]+(actor.s.eidolon>=1?.35:0),0)){dummies[0].freeze={owner:actor.id,coefficient:p[3]};debuffApplied(actor);record(actor,'Заморозка');}afterAttack(actor);}
        else if(actor.id==='1208'){const active=actor.matrixUntil>actor.turn,before=actors.map(a=>stat(a).hp);if(actor.matrixWasActive)energy(actor,20);const hp=stat(actor).hp-(active?actor.matrixHP:0);actor.matrixHP=hp*p[3];actor.matrixUntil=actor.turn+p[2];for(const [i,a] of actors.entries()){a.currentHP+=Math.max(0,stat(a).hp-before[i]);assist(a,actor);}record(actor,'Матрица предвидения · HP и крит. шанс');}
        else if(actor.id==='1101'){if(actor.s.eidolon>=1&&actor.turn>=(actor.bronyaRefundReady||0)&&rng()<.5){gainSP();actor.bronyaRefundReady=actor.turn+2;}if(actor.s.eidolon>=2)target.bronyaSpeedPending=true;buff(target,actor.id,'bronyaSkill',{damage:p[0]},p[2]+(actor.s.eidolon>=6?1:0));if(target!==actor)target.distance=0;assist(target,actor);record(actor,'Навык Брони → '+data.characters[target.id].name);}
        else if(actor.id==='1202'){const flat=Math.min(target.s.baseAtk*p[1],stat(actor).atk*p[3]);buff(target,actor.id,'benediction',{flatAtk:flat},p[2]);actor.blessing={target:target.id,expires:target.turn+p[2]};buff(actor,actor.id,'tySpeed',{speedPct:.2},1);if(target!==actor)assist(target,actor);record(actor,'Благословение → '+data.characters[target.id].name);}
        else if(actor.id==='1106'){hit(actor,p[0],[0],'Навык Пелы',{pelaTrace:true});if(actor.s.eidolon>=4&&rng()<effectChance(actor,1,0)){dummies[0].pelaIceUntil=dummies[0].turn+2;debuffApplied(actor);}if(isExposed())energy(actor,params('1106','04')[0]);afterAttack(actor);}
        else if(actor.id==='1009'){const struck=new Set([0]);hit(actor,p[0],[0],'Навык Асты · первый удар');for(let n=0;n<4+(actor.s.eidolon>=1?1:0);n++){const index=Math.floor(rng()*dummies.length);struck.add(index);hit(actor,p[0],[index],'Навык Асты · отскок');}actor.charges=Math.min(p.length?params('1009','04')[1]:5,actor.charges+struck.size*2);afterAttack(actor);}
        else if(actor.id==='1102'){const old=actor.buffs.find(b=>b.key==='seeleSpeed'&&b.expires>=actor.turn)?.values.speedPct||0;buff(actor,actor.id,'seeleSpeed',{speedPct:actor.s.eidolon>=2?Math.min(p[1]*2,old+p[1]):p[1]},p[2]);hit(actor,p[0],[0],'Навык Зеле');afterAttack(actor);}
        else if(actor.id==='1220'){buff(actor,actor.id,'fxAttack',{atk:.48},3);hit(actor,p[0],[0],'Навык Фэйсяо');afterAttack(actor);feixiaoFollow(actor);}
        else if(actor.id==='1013'){hit(actor,p[0],dummies.map((_,i)=>i),'Навык Герты',{bonus:.45});afterAttack(actor);}
        else if(actor.id==='1103'){hit(actor,p[0],[0],'Навык Сервал');const adjacent=Array.from({length:Math.min(2,dummies.length-1)},(_,i)=>i+1);if(adjacent.length)hit(actor,p[1],adjacent,'Навык Сервал · соседние цели');for(let i=0;i<Math.min(3,dummies.length);i++)dummies[i].shock={owner:actor.id,expires:dummies[i].turn+p[3],coefficient:p[4]};debuffApplied(actor);servalTalent(actor);afterAttack(actor);}
        else if(actor.id==='1003'){hit(actor,p[0],[0],'Навык Химеко');if(dummies.length>1)hit(actor,p[1],allTargets().slice(1,3),'Навык Химеко · соседние цели');himekoBurn(actor,allTargets().slice(0,3));afterAttack(actor);}
        else if(actor.id==='1005'){hit(actor,p[0],[0],'Навык Кафки');if(dummies.length>1)hit(actor,p[2],allTargets().slice(1,3),'Навык Кафки · соседние цели');detonate([0],p[1]);afterAttack(actor);}
        else if(actor.id==='1204'){buff(actor,actor.id,'jingCrit',{crit:.1},2);hit(actor,p[0],allTargets(),'Навык Цзин Юаня');lordAdd(actor,p[1],6);afterAttack(actor);}
        else if(actor.id==='1305'){actor.ratioStacks=Math.min(actor.s.eidolon>=1?10:6,actor.ratioStacks+debuffCount());hit(actor,p[0],[0],'Навык Рацио');dummies[0].ratioDebuff=dummies[0].turn+2;debuffApplied(actor);afterAttack(actor);if(rng()<Math.min(1,params('1305','04')[1]+params('1305','04')[2]*debuffCount()))ratioFollow(actor);}
        else if(actor.id==='1205'){loseHP(actor,stat(actor).hp*p[0]);buff(actor,actor.id,'hellscape',{damage:p[3]},p[1]-1);actor.bladeUntil=actor.turn+p[1];record(actor,'Адский пейзаж · расход HP');if(G)G.afterSkill(actor);bladeFollow(actor);bladeEnhanced(actor);}
        else if(actor.id==='1002'){hit(actor,p[0],[0],'Навык Дань Хэна');const s=stat(actor),gear=G?G.damage(actor,s,{kind:'skill',followup:false,ultimate:false,dot:false},{debuffs:debuffCount(),element:'Wind'}):{crit:0},chance=1-Math.pow(1-clamp(s.crit+gear.crit+(actor.id==='8001'&&actor.s.eidolon>=4&&maxToughness&&dummies[target].toughness===0?.25:0),0,1)*effectChance(actor,p[3],0),4);if(rng()<chance){dummies[0].slowUntil=dummies[0].turn+p[2];dummies[0].danSlow=actor.s.eidolon>=6?.2:.12;debuffApplied(actor);record(actor,actor.s.eidolon>=6?'Замедление · скорость болванки −20%':'Замедление · скорость болванки −12%');}afterAttack(actor);}
        else if(actor.id==='1109'){const enhanced=actor.hookEnhanced,q=enhanced?data.character_skills['110909'].params[actor.s.eidolon>=3?11:9]:p;actor.hookEnhanced=false;hit(actor,q[0],[0],enhanced?'Усиленный навык Хук':'Навык Хук',{bonus:enhanced&&actor.s.eidolon>=1?.2:0});if(enhanced&&dummies.length>1)hit(actor,q[4],allTargets().slice(1,3),'Усиленный навык Хук · соседние цели',{bonus:actor.s.eidolon>=1?.2:0});applyBurn(actor,'hookBurn',[0],q[1],q[3],q[2]+(actor.s.eidolon>=2?1:0));hookTalent(actor,enhanced?allTargets().slice(0,3):[0]);afterAttack(actor);}
        else if(actor.id==='1210'){hit(actor,p[0],[0],'Навык Гуйнайфэнь');if(dummies.length>1)hit(actor,p[1],allTargets().slice(1,3),'Навык Гуйнайфэнь · соседние цели');guiAttack(actor,allTargets().slice(0,3),p[2],true);afterAttack(actor);}
        else if(actor.id==='1105'){const patient=[...actors].sort((a,b)=>a.currentHP/stat(a).hp-b.currentHP/stat(b).hp)[0];heal(patient,stat(actor).hp*p[0]+p[3],actor);patient.hot={owner:actor.id,amount:stat(actor).hp*p[1]+p[4],turns:p[2]+1};if(patient!==actor)assist(patient,actor);record(actor,'Лечение → '+data.characters[patient.id].name);}
    }
    function regular(actor){
      turnOwner=actor;beginAction(actor);if(novaAllyAssist(actor)){finishTurn(actor);return;}
      turnSPSpent=0;
      actor.matrixWasActive=actor.matrixUntil>actor.turn;
      const q=find('1201');if(q)drawTile(q);actor.turn++;actor.normal++;actor.distance=10000;if(actor.lynxHot){const hot=actor.lynxHot,healer=find(hot.owner);if(hot.expires>=actor.turn){const enhanced=actor.buffs.some(b=>b.source===hot.owner&&b.key==='survival'&&b.expires>=actor.turn);const p=params(healer.id,'04');heal(actor,stat(healer).hp*(p[1]+(enhanced?p[3]:0))+p[2]+(enhanced?p[4]:0),healer);}if(hot.expires<=actor.turn)actor.lynxHot=null;}if(G)G.startTurn(actor);if(actor.hot){heal(actor,actor.hot.amount,find(actor.hot.owner));if(--actor.hot.turns<=0)actor.hot=null;}
      if(actor.id==='1304')actor.bingo=0;
      if(actor.id==='1313'&&actor.s.eidolon>=4)energy(actor,8);
      if(actor.id==='1308'&&actor.s.eidolon>=2)acheronGain(1,mostKnots());
      if(actor.id==='1314'&&!(actor.debtUntil>actor.turn))for(const a of actors)a.buffs=a.buffs.filter(b=>!(b.source==='1314'&&b.key==='debtSpeed'));
      const jade=find('1314');if(jade?.debtor===actor.id&&jade.debtUntil>jade.turn)jade.pawn=Math.min(50,(jade.pawn||0)+3);
      huohuoHeal(actor);
      actor.buffs=actor.buffs.filter(b=>!(b.key==='sparkleSkill'&&b.expires<=actor.turn));
      actor.currentHP=Math.min(actor.currentHP,stat(actor).hp);if(actor.id==='1409'&&actor.rainUntil===actor.turn){for(const a of livingAllies())a.currentHP=Math.min(a.currentHP,stat(a).hp);record(actor,'После дождя · окончание');}
      if(actor.id==='1302')actor.apotheosis=Math.min(10+(actor.s.eidolon>=4?2:0),(actor.apotheosis||0)+1);
      if(actor.id==='1001')actor.marchCounters=0;
      if(actor.id==='1015'&&actor.s.eidolon>=6)gainSP();
      if(actor.id==='1224'&&actor.s.eidolon>=4)energy(actor,5);
      const march=find('1001');if(march?.s.eidolon>=6&&actor.marchShield?.skill&&actor.marchShield.expires>=actor.turn)heal(actor,stat(actor).hp*.04+106,march);
      if(actor.id==='1303')energy(actor,5);
      if(actor.id==='1321')actor.dahliaUsed=false;
      if(actor.natashaE2){const healer=find(actor.natashaE2);actor.natashaE2=null;heal(actor,stat(healer).hp*.06+160,healer);}
      const bailu=find('1211');if(bailu?.s.eidolon>=1&&actor.vigorUntil===actor.turn&&actor.currentHP>=stat(actor).hp)energy(actor,8);
      sixthStartTurn(actor);
      if(aeon?.emanator===actor.id)wishpower(1);
      if(actor===aeon){aeonRegular(actor);finishTurn(actor);return;}
      if(finalRegular(actor)||sixthRegular(actor)||fifthRegular(actor)||batchRegular(actor)||breakRegular(actor)){finishTurn(actor);return;}
      if(actor.id==='1104')actor.gepardATK=stat(actor).def*.35;
      if(actor.id==='1212'&&actor.transmigration){coup(actor,()=>jingliuEnhanced(actor),true);jingliuEnhanced(actor);finishTurn(actor);return;}
      if(actor.id==='1213'){ilBasic(actor);finishTurn(actor);return;}
      if(actor.id==='1005')actor.fuaReady=true;
      if(actor.id==='1220'){actor.e2Triggers=0;if(!actor.fuaSinceTurn){attacks++;if(attacks%2===0)actor.resource=Math.min(12,actor.resource+1);}actor.fuaSinceTurn=false;actor.fuaReady=true;}
      if(actor.id==='1202')energy(actor,5);
      if(actor.id==='1009'){if(actor.turn>1&&!actor.keepCharges)actor.charges=Math.max(0,actor.charges-params('1009','04')[2]+(actor.s.eidolon>=6?1:0));actor.keepCharges=false;}
      const target=focusFor(actor),p=params(actor.id,'02');let useSkill=false;
      if(actor.s.policy!=='basic'&&sp>0){
        if(actor.s.policy==='skill')useSkill=actor.id!=='1105';
        else if(actor.id==='1202')useSkill=!target.buffs.some(b=>b.source===actor.id&&b.key==='benediction');
        else if(actor.id==='1101')useSkill=true;
        else if(actor.id==='1009')useSkill=actor.charges<5;
        else if(actor.id==='1105')useSkill=actors.some(a=>a.currentHP<stat(a).hp*.5);
        else if(actor.id==='1303')useSkill=!(actor.meiSkillUntil>actor.turn);
        else if(actor.id==='1309')useSkill=!(actor.robinSkillUntil>actor.turn);
        else if(actor.id==='1306')useSkill=true;
        else if(actor.id==='1006')useSkill=!(dummies[0].swResUntil>dummies[0].turn);
        else if(actor.id==='1313')useSkill=true;
        else if(actor.id==='1314')useSkill=!(actor.debtUntil>actor.turn);
        else if(actor.id==='1222')useSkill=fuyuan.actions<=1||actors.some(a=>a.currentHP<stat(a).hp*.7);
        else if(actor.id==='1225')useSkill=!(actor.fugueUntil>actor.turn);
        else if(actor.id==='1403')useSkill=!(actor.sanctifyUntil>actor.turn);
        else if(actor.id==='1217')useSkill=!(actor.divineUntil>actor.turn);
        else if(actor.id==='1304')useSkill=actors.some(a=>!(a.avenShield?.expires>a.turn));
        else if(actor.id==='1208')useSkill=!(actor.matrixUntil>actor.turn);
        else if(actor.id==='1203'||actor.id==='1211')useSkill=actors.some(a=>a.currentHP<stat(a).hp*.5);
        else if(actor.id==='1210')useSkill=allTargets().slice(0,3).some(i=>!dummies[i].guiBurn);
        else if(models[actor.id].role==='dps')useSkill=true;
      }
      if(actor.id==='1205'&&actor.bladeUntil>actor.turn)useSkill=false;
      if(actor.id==='1314'&&actor.debtUntil>actor.turn)useSkill=false;
      actor.actionKind=useSkill?'skill':'basic';
      if(useSkill){spendSP();coup(actor,()=>castRegularSkill(actor));castRegularSkill(actor);
      }else{
        if(actor.id==='1205'&&actor.bladeUntil>actor.turn){bladeEnhanced(actor);runUlts();actor.buffs=actor.buffs.filter(b=>b.expires>actor.turn);if(G)G.endTurn(actor);return;}
        gainSP();energy(actor,actor.id==='1306'?30:20);const bonus=actor.id==='1202'?.4:actor.id==='1004'&&(!maxToughness||dummies[0].toughness===0)?.2:0;
        const followup=actor.id==='1112';if(followup)actor.followups++;
        if(actor.id==='1304'&&actor.s.eidolon>=2){dummies[0].avenResUntil=dummies[0].turn+3;debuffApplied(actor);}
        const fugueBasic=actor.id==='1225'&&actor.fugueUntil>actor.turn;hit(actor,fugueBasic?1:params(actor.id,'01')[0],[0],'Базовая атака',{bonus:bonus+(actor.id==='1405'?.3:0),followup,baseDamage:['1208','1217','1403'].includes(actor.id)?params(actor.id,'01')[0]*stat(actor).hp:actor.id==='1304'?params(actor.id,'01')[0]*stat(actor).def:undefined,guaranteedCrit:actor.id==='1101',pelaTrace:actor.id==='1106'});
        if(fugueBasic&&dummies.length>1)hit(actor,.5,allTargets().slice(1,3),'Базовая Фуги · соседние цели');
        if(actor.id==='1403'&&dummies.length>1)hit(actor,0,allTargets().slice(1,3),'Базовая Трибби · соседние цели',{baseDamage:stat(actor).hp*.15});
        if(actor.id==='1222'||actor.id==='1405')energy(actor,10);
        if(actor.id==='1307'){const types=dotTypes(0);arcanaAdd(0);for(const t of types)arcanaAdd(0);}
        if(actor.id==='1314'&&dummies.length>1)hit(actor,params(actor.id,'01')[1],allTargets().slice(1,3),'Базовая Яшмы · соседние цели');
        if(actor.id==='1218')ash(actor,[0]);
        if(actor.id==='1004'){weltTalent(actor,[0]);if(actor.weltEcho>0){actor.weltEcho--;hit(actor,params(actor.id,'01')[0]*.5,[0],'Вельт E1 · дополнительный урон',{kind:'additional',toughness:0});}}if(actor.id==='1302')argentiTalent(actor,1);
        if(actor.id==='1101')actor.distance=Math.max(0,actor.distance-10000*params('1101','04')[0]);
        if(actor.id==='1009'){actor.charges=Math.min(5,actor.charges+2);if(rng()<clamp(.8*(1+stat(actor).effectHit),0,1))dummies[0].burn={owner:actor.id,expires:dummies[0].turn+3,coefficient:.5};}
        if(actor.id==='1106'&&isExposed())energy(actor,params('1106','04')[0]);
        if(actor.id==='1103'){const adjacent=allTargets().slice(1,2);if(actor.s.eidolon>=1&&adjacent.length)hit(actor,params('1103','01')[0]*.6,adjacent,'Сервал E1 · соседняя цель',{toughness:0});servalTalent(actor);}
        if(actor.id==='1003')himekoBurn(actor,[0]);
        if(actor.id==='1105'&&actor.s.eidolon>=6)hit(actor,0,[0],'Наташа E6 · дополнительный урон',{kind:'additional',baseDamage:stat(actor).hp*.4,toughness:0});
        if(actor.id==='1109')hookTalent(actor,[0]);
        if(actor.id==='1210')guiAttack(actor,[0],.8);
        if(actor.id==='1202'&&actor.blessing){const blessed=find(actor.blessing.target);if(blessed.buffs.some(b=>b.source===actor.id&&b.key==='benediction')){const scale=stat(blessed).atk/stat(actor).atk;hit(actor,(params('1202','04')[0]+(actor.s.eidolon>=4?.2:0))*scale,[0],'Талант Тинъюнь');}}
        afterAttack(actor);
        if(actor.id==='1405')anaxaSkill(actor);
      }
      if(G){if(useSkill&&!['1205','1405'].includes(actor.id))G.afterSkill(actor);else if(!useSkill)G.afterBasic(actor);}finishTurn(actor);
    }
    function finishTurn(actor){if(actor.bronyaSpeedPending){actor.bronyaSpeedPending=false;buff(actor,'1101','bronyaE2',{speedPct:.3},1);}if(actor.id==='1413'&&actor.actionKind==='skill'&&actor.ode==='evernight')everGain(1);if(actor.id==='1409'&&actor.actionKind==='skill'&&actor.odeSky>0)actor.odeSky--;expireBangers(actor);actor.bangers=(actor.bangers||[]).filter(b=>b.expires>actor.turn);sixthAction(actor);cerydraAction(actor);yukongAction(actor);settleHP();settleFinal();runUlts();actor.buffs=actor.buffs.filter(b=>b.expires>actor.turn);const yk=find('1207');if(yk?.bow>0&&!(actor===yk&&yk.bowAcquiredTurn===yk.turn)){yk.bow--;if(!yk.bow)yk.bowCrit=false;record(yk,'Ревущая тетива · осталось '+yk.bow);}if(actor.dragonShield?.expires<=actor.turn)actor.dragonShield=null;actor.currentHP=Math.min(actor.currentHP,stat(actor).hp);actor.righteous=0;if(actor.s.eidolon<4||actor.id!=='1213'||actor.outroarUntil===actor.turn)actor.outroar=0;if(actor.shield?.expires<=actor.turn)actor.shield=null;if(actor.avenShield?.expires<=actor.turn)actor.avenShield=null;if(G)G.endTurn(actor);activeActor=null;turnOwner=null;}
    function afterUlt(actor){const ty=find('1202');if(ty?.s.eidolon>=1&&actor.buffs.some(b=>b.source===ty.id&&b.key==='benediction'&&b.expires>=actor.turn))buff(actor,ty.id,'tingyunE1',{speedPct:.2},1);const il=find('1213');if(il&&il!==actor&&il.s.eidolon>=6)il.ilPen=Math.min(3,(il.ilPen||0)+1);if(actor.id==='1413'&&actor.ode==='evernight')everGain(1);sixthAfterUlt(actor);sixthAction(actor);yukongAction(actor,actor.ultimateKey);const saber=find('1014');if(saber){resonance(saber,3);energy(saber,5);buff(saber,saber.id,'saberTalent',{damage:params(saber.id,'04')[2]},2);}const c=find('1412');if(c?.merit===actor.id&&!c.cUltUsed&&c.cCharge<8){c.cUltUsed=true;cCharge(c,1);}const m=find('1224');if(m?.master===actor.id&&actor.lastHeroAttackKey!==actor.ultimateKey)marchGain(m);if(G?.has(actor,'118',4)&&['1101','1202','1009','1303','1309','1306','1217','1313','1105','1211','1104','8005','1215','1414'].includes(actor.id))for(const a of actors)buff(a,'118','watchmaker',{breakEffect:.3},2);const t=form.active?null:find('1403');if(t&&(t!==actor||t.s.eidolon>=6)&&!(t.tribSeen||new Set()).has(actor.id)){t.tribSeen??=new Set();t.tribSeen.add(actor.id);t.followups++;energy(t,5);hit(t,0,allTargets(),'Трибби · бонус-атака',{followup:true,baseDamage:stat(t).hp*params(t.id,'04')[0],bonus:t.s.eidolon>=6?7.29:0});t.tribStacks=Math.min(3,(t.tribStacksUntil>t.turn?t.tribStacks||0:0)+1);t.tribStacksUntil=t.turn+3;afterAttack(t,false,'followup');}activeActor=null;}
    function allTargets(){return dummies.map((_,i)=>i);}
    function hookTalent(actor,targets){const burned=targets.filter(burning);if(!burned.length)return;hit(actor,params('1109','04')[0],burned,'Талант Хук · дополнительный урон',{kind:'additional'});energy(actor,params('1109','04')[1]);heal(actor,stat(actor).hp*.05);if(actor.s.eidolon>=4){const p=params('1109','02');const adjacent=[...new Set(burned.flatMap(i=>[i-1,i+1]))].filter(i=>i>=0&&i<dummies.length);applyBurn(actor,'hookBurn',adjacent,1,p[3],p[2]+1);}}
    function bladeEnhanced(actor){actor.actionKind='basic';const p=data.character_skills['120508'].params[actor.s.eidolon>=5?6:5];loseHP(actor,stat(actor).hp*p[0]);energy(actor,30);const s=stat(actor);hit(actor,0,[0],'Частокол мечей',{baseDamage:s.atk*p[1]+s.hp*p[3]});if(dummies.length>1)hit(actor,0,allTargets().slice(1,3),'Частокол мечей · соседние цели',{baseDamage:s.atk*p[2]+s.hp*p[4]});afterAttack(actor);if(G)G.afterBasic(actor);if(!maxToughness||dummies.slice(0,3).some(d=>d.toughness===0))heal(actor,s.hp*.05+100);bladeFollow(actor);}
    function lordTurn(){const actor=find('1204'),p=params('1204','04'),hits=lord.hits;actor.followups++;if(G)G.followupStart(actor);for(let i=0;i<hits;i++){const index=Math.floor(rng()*dummies.length),snapshot=stat(actor);hit(actor,p[1],[index],'Повелитель молний · удар',{followup:true,group:true,statSnapshot:snapshot,extraCritDamage:hits>=6?.25:0});const adjacent=[index-1,index+1].filter(j=>j>=0&&j<dummies.length);if(adjacent.length)hit(actor,p[1]*(p[4]+(actor.s.eidolon>=1?.25:0)),adjacent,'Повелитель молний · соседние цели',{followup:true,group:true,statSnapshot:snapshot,extraCritDamage:hits>=6?.25:0});if(actor.s.eidolon>=4)energy(actor,2);if(actor.s.eidolon>=6)for(const target of [index,...adjacent])dummies[target].jingWeak=Math.min(3,(dummies[target].jingWeak||0)+1);}if(G)G.followupEnd(actor,actors);afterAttack(actor,false,'followup');if(actor.s.eidolon>=2)buff(actor,actor.id,'jingE2',{},2);if(actor.s.eidolon>=6)for(const d of dummies)d.jingWeak=0;lord.hits=3;lord.distance=10000;lord.exUntil=actor.turn+4;runUlts();}
    function numbyTurn(){const actor=find('1112'),enhanced=numby.enhanced>0;if(actor.s.eidolon>=4)actor.distance=Math.max(0,actor.distance-2000);numby.acting=true;numby.distance=10000;actor.followups++;hit(actor,params('1112','04')[1]+(enhanced?params('1112','03')[0]:0),[0],enhanced?'Счетовод · усиленная атака':'Счетовод · атака',{followup:true,extraCritDamage:enhanced?params('1112','03')[1]:0});if(enhanced){numby.enhanced--;energy(actor,10);}if(actor.s.eidolon>=2)energy(actor,5);afterAttack(actor,false,'followup');numby.acting=false;runUlts();}
    // Standing dummies stay at 100% HP. Optional toughness is restored on their turn;
    // take turns for DoT/debuff durations, and never attack or die.
    if(find('1303'))for(const actor of actors)if(actor.id!=='1303')buff(actor,'1303','ruanSpeed',{speedPct:params('1303','04')[0]},100000);
    if(find('1403')){energy(find('1403'),30);find('1403').tribSeen=new Set();}
    if(find('1410')){find('1410').hysiUntil=3;gainSP();}
    if(find('1308'))dummies[0].knots=5;
    if(find('1307'))for(const i of allTargets())arcanaAdd(i);
    if(find('1401')){for(const i of allTargets())interpret(i);interpret(Math.floor(rng()*dummies.length),25);}
    if(find('1304'))aventShield(find('1304'));
    if(find('1314')){find('1314').pawn=dummies.length;find('1314').distance=Math.max(0,find('1314').distance-5000);}
    if(find('1217'))find('1217').divineUntil=1;
    for(const [id,amount] of [['1213',15],['1218',15],['1313',25]])if(find(id))energy(find(id),amount);
    if(G)for(const actor of actors){const s=stat(actor);actor.currentHP=s.hp;actor.eq.startSpeed=actor.s.speed+actor.s.baseSpeed*(actor.eq.p.SpeedAddedRatio||0);actor.eq.startCritDamage=s.critDamage;if(G.has(actor,'308')&&s.speed>=120)actor.distance-=4000;if(G.has(actor,'101',4))gainSP();}
    if(find('1104'))find('1104').gepardATK=stat(find('1104')).def*.35;
    if(find('1208'))find('1208').reversals=1;
    if(find('1302')){const argenti=find('1302');if(argenti.s.eidolon>=4)argenti.apotheosis=2;energy(argenti,2*dummies.length);}
    if(find('1001')?.s.eidolon>=2){const march=find('1001'),target=[...actors].sort((a,b)=>a.currentHP/stat(a).hp-b.currentHP/stat(b).hp)[0];target.marchShield={amount:stat(march).def*.24+320,expires:target.turn+3};record(march,'Март 7 E2 · начальный щит');}
    if(find('1309'))find('1309').distance=Math.max(0,find('1309').distance-2500);
    if(find('1210'))find('1210').distance=Math.max(0,find('1210').distance-2500);
    if(find('1103'))energy(find('1103'),15);if(find('1204'))energy(find('1204'),15);
    if(find('1310'))find('1310').energy=Math.max(120,find('1310').energy);if(find('1111')){const luka=find('1111');luka.will=1;if(luka.s.eidolon>=4)luka.lukaE4=1;}if(find('1003')&&maxToughness)find('1003').himekoCharges=1;if(find('1321')){const a=find('1321');a.partner=core===a?focusFor(a).id:core.id;energy(a,35);dahliaBless(1);}
    if(find('1014')){const a=find('1014');a.energy=Math.max(216,a.energy);a.manaBurst=true;resonance(a,1);}if(find('1015')){find('1015').archerCharge=1;find('1015').resource=1;}if(find('1404')){const a=find('1404'),extra=Math.min(4000,Math.max(0,stat(a).hp-4000));a.mydeiCrit=extra*.00012;a.mydeiHeal=extra*.000075;}if(find('1414'))find('1414').distance=6000;if(find('1223')){const a=find('1223');a.distance=7000;if(a.s.eidolon>=1)energy(a,20);}if(find('1224'))find('1224').distance=7500;
    if(find('1404')?.s.eidolon>=6){const a=find('1404');a.vendettaHP=stat(a).hp*.5;a.vendetta=true;a.currentHP+=a.vendettaHP;record(a,'Мидей E6 · Кровная месть в начале боя');}
    if(find('8005')?.s.eidolon>=2)buff(find('8005'),'8005','hmcE2',{energyRegen:.25},3);
    if(find('1402'))find('1402').energy=Math.max(175,find('1402').energy);if(find('1408')){find('1408').resource=find('1408').s.eidolon>=6?7:1;find('1408').phainonAtkStacks=1;}if(find('8001'))energy(find('8001'),15);if(find('8003')?.s.eidolon>=4)find('8003').magma=4;if(find('1312')){find('1312').mishaHits=3;find('1312').resource=3;}
    sixthInit();finalInit();
    if(find('1315')?.s.eidolon>=1)find('1315').pocket=1;
    if(find('1317')?.s.eidolon>=6)find('1317').rappaCharges=5;
    if(find('1401')?.s.eidolon>=2)find('1401').inspiration=1;
    if(find('1206')?.s.eidolon>=6)sushangSpeed(find('1206'));
    if(find('1207')?.s.eidolon>=1)for(const actor of actors)buff(actor,'1207','yukongE1',{speedPct:.1},2);
    const ratio=find('1305');if(ratio?.s.eidolon>=1)ratio.ratioStacks=4;
    const gallagher=find('1301');if(gallagher?.s.eidolon>=1){gallagher.s.effectRes+=.5;energy(gallagher,20);}
    if(aeon){aeon.distance=7000;aeon.energy=0;aeon.resource=aeon.s.eidolon>=1?5:0;}
    const initialStats=Object.fromEntries(actors.map(a=>[a.id,stat(a)]));runUlts();
    const checkpoints=(scenario.sampleCycles||[]).map(cycles=>({cycles,av:150+(cycles-1)*100}));
    let sampleIndex=0;
    function captureBefore(time){
      while(sampleIndex<checkpoints.length&&checkpoints[sampleIndex].av<time-1e-8){
        checkpoints[sampleIndex++].total=actors.reduce((sum,a)=>sum+a.total,0);
      }
    }
    while(now<horizon-1e-9&&steps++<10000){
      let next=actors[0],delta=Infinity;
      for(const actor of actors){const dt=form.active||actor.departed||(actor.id==='1309'&&actor.concertoUntil>now)||(actor.id==='1512'&&actor.fever)?Infinity:actor.distance/stat(actor).speed;if(dt<delta-1e-9){delta=dt;next=actor;}}
      const lordDelta=lord&&!form.active?lord.distance/(60+10*(lord.hits-3)):Infinity,lordNext=lordDelta<delta-1e-9;if(lordNext)delta=lordDelta;
      const numbyDelta=numby&&!form.active?numby.distance/80:Infinity,numbyNext=numbyDelta<delta-1e-9;if(numbyNext)delta=numbyDelta;
      const fuyuanDelta=fuyuan?.actions>0&&!form.active?fuyuan.distance/90:Infinity,fuyuanNext=fuyuanDelta<delta-1e-9;if(fuyuanNext)delta=fuyuanDelta;
      const dragonDelta=dragon?.active&&!form.active?dragon.distance/165:Infinity,dragonNext=dragonDelta<delta-1e-9;if(dragonNext)delta=dragonDelta;
      const ff=find('1310'),combustDelta=ff?.combustionUntil>now&&!form.active?ff.combustionUntil-now:Infinity,combustNext=combustDelta<delta-1e-9;if(combustNext)delta=combustDelta;
      const robin=find('1309'),concertDelta=robin?.concertoUntil>now&&!form.active?robin.concertoUntil-now:Infinity,concertNext=concertDelta<delta-1e-9;if(concertNext)delta=concertDelta;
      let memoryNext=null;for(const m of memories)if(m.active&&!form.active&&memoSpeed(m)>0){const dt=m.distance/memoSpeed(m);if(dt<delta-1e-9){delta=dt;memoryNext=m;}}const ag=find('1402'),supremeDelta=ag?.supremeUntil>now&&!form.active?ag.supremeUntil-now:Infinity,supremeNext=supremeDelta<delta-1e-9;if(supremeNext)delta=supremeDelta;const formDelta=form.active?form.distance/(phainonSpeed(find('1408'))):Infinity,formNext=formDelta<delta-1e-9;if(formNext)delta=formDelta;
      const ahaDelta=elationActors.length&&!form.active?aha.distance/ahaSpeed():Infinity,ahaNext=ahaDelta<delta-1e-9;if(ahaNext)delta=ahaDelta;const mb=find('1507'),rageDelta=mb?.rageUntil>now&&!form.active?mb.rageUntil-now:Infinity,rageNext=rageDelta<delta-1e-9;if(rageNext)delta=rageDelta;
      const summer=find('1512'),summerDelta=summer?.fever&&!form.active?summer.summerDistance/140:Infinity,summerNext=summerDelta<delta-1e-9;if(summerNext)delta=summerDelta;
      const dummySpeed=targetSpeed;let dummyIndex=0;for(let i=1;i<dummies.length;i++)if(dummies[i].distance/dummySpeed(i)<dummies[dummyIndex].distance/dummySpeed(dummyIndex)-1e-9)dummyIndex=i;
      const dummyDelta=dummies[dummyIndex].distance/dummySpeed(dummyIndex);const dummyNext=dummyDelta<delta-1e-9;if(dummyNext)delta=dummyDelta;
      captureBefore(now+delta);
      if(now+delta>horizon+1e-8)break;
      if(form.active){form.distance=Math.max(0,form.distance-delta*phainonSpeed(find('1408')));for(const a of actors){if(a.concertoUntil>now)a.concertoUntil+=delta;if(a.combustionUntil>now)a.combustionUntil+=delta;if(a.supremeUntil>now)a.supremeUntil+=delta;if(a.rageUntil>now)a.rageUntil+=delta;}}else for(const m of memories)if(m.active&&memoSpeed(m)>0)m.distance=Math.max(0,m.distance-delta*memoSpeed(m));
      if(!form.active&&summer?.fever)summer.summerDistance=Math.max(0,summer.summerDistance-delta*140);
      if(!form.active&&elationActors.length)aha.distance=Math.max(0,aha.distance-delta*ahaSpeed());
      if(!form.active&&dragon?.active)dragon.distance=Math.max(0,dragon.distance-delta*165);
      if(!form.active&&fuyuan?.actions>0)fuyuan.distance=Math.max(0,fuyuan.distance-delta*90);
      for(const actor of actors)if(!form.active&&!actor.departed&&!(actor.id==='1309'&&actor.concertoUntil>now)&&!(actor.id==='1512'&&actor.fever))actor.distance=Math.max(0,actor.distance-delta*stat(actor).speed);if(lord&&!form.active)lord.distance=Math.max(0,lord.distance-delta*(60+10*(lord.hits-3)));if(numby&&!form.active)numby.distance=Math.max(0,numby.distance-delta*80);for(let i=0;i<dummies.length;i++)dummies[i].distance=Math.max(0,dummies[i].distance-delta*dummySpeed(i));now+=delta;
      eventSerial++;
      if(dummyNext){activeActor=null;enemySerial++;enemyPhase=true;enemyIndex=dummyIndex;const d=dummies[dummyIndex],canAttack=!(maxToughness&&d.toughness===0)&&!d.freeze;for(const enemy of dummies)enemy.hysiCount=0;d.distance=10000;if(maxToughness){if(d.rebloom&&d.toughness===0){const m=find(d.rebloom.owner);d.rebloom=null;d.rebloomLock=true;d.distance=10000*(.1+.2*breakValue(m));breakDamage(m,dummyIndex,.5,'Ice','Цветение Жуань Мэй');record(m,'Цветение · восстановление стойкости отложено');enemyPhase=false;enemyIndex=-1;continue;}breakTick(dummyIndex);if(d.toughness===0){if(d.breakFrozen){d.breakFrozen=false;d.distance=5000;record(null,'Заморозка пробития · восстановление отложено');}else{d.toughness=maxToughness;d.exo=0;d.rebloomLock=false;record(null,'Стойкость восстановлена · цель '+(dummyIndex+1));}}}const jiao=find('1218');if(jiao&&jiao.jiaoZoneUntil>jiao.turn&&(jiao.jiaoTriggers||0)<6){jiao.jiaoTriggers=(jiao.jiaoTriggers||0)+1;ash(jiao,[dummyIndex],params('1218','03')[1]);record(jiao,'Зона Цзяоцю · активация '+jiao.jiaoTriggers);}const swan=find('1307');if(swan?.s.eidolon>=4&&d.epiphanyUntil>d.turn&&!d.swanEnergyUsed){d.swanEnergyUsed=true;energy(swan,8);}for(const key of dotKeys)if(d[key])dotHit(dummyIndex,key,1,key==='arcana'?'Тик Аркана':burnKeys.includes(key)?'Тик Горения':'Тик DoT',true);if(d.freeze){const freezer=find(d.freeze.owner);if(freezer?.id==='1104'&&freezer.s.eidolon>=2)d.gepardSlowUntil=d.turn+2;hit(freezer,d.freeze.coefficient,[dummyIndex],'Заморозка · урон',{kind:'additional',fixedCritical:1});d.freeze=null;d.distance=5000;record(null,'Разморозка · продвижение 50%');}d.turn++;d.sublimation=false;for(const key of dotKeys)if(d[key]?.expires<=d.turn)d[key]=null;record(null,'Ход болванки '+(dummyIndex+1));if(canAttack&&(!maxToughness||d.toughness>0)&&scenario.enemyAttacks==='training'&&!form.active)trainingAttack(dummyIndex);enemyPhase=false;enemyIndex=-1;runUlts();}
      else if(summerNext){summerTick(summer);runUlts();}
      else if(ahaNext){aha.distance=10000;ahaTurn();runUlts();}
      else if(rageNext){mb.rageUntil=0;mb.energy=Math.max(mb.energy,data.characters[mb.id].max_sp*.75);record(mb,'Безмерная ярость · окончание');runUlts();}
      else if(formNext)phainonTurn();
      else if(supremeNext){const m=memo('1402');m.active=false;m.owner.memoryActive=false;m.stacks=Math.min(1,m.stacks);ag.supremeUntil=0;energy(ag,20);record(ag,'Высшая форма · Швея исчезает');runUlts();}
      else if(memoryNext){memoryTurn(memoryNext);runUlts();}
      else if(combustNext){ff.combustionUntil=0;record(ff,'Полное сгорание · окончание');runUlts();}
      else if(concertNext){robin.concertoUntil=0;robin.distance=0;record(robin,'Концерт · окончание');runUlts();}
      else if(dragonNext){dragonTurn();runUlts();}
      else if(fuyuanNext){fuyuanTurn();runUlts();}
      else if(numbyNext)numbyTurn();
      else if(lordNext)lordTurn();
      else regular(next);
      const y=find('1221');if(!form.active&&y?.parry&&y.parryAt<eventSerial){yunliCounter(y);runUlts();}
    }
    if(steps>=10000)throw Error('Слишком много событий: проверь скорость и продвижение действий.');
    captureBefore(Infinity);
    const total=actors.reduce((sum,a)=>sum+a.total,0);
    return {ids:[...ids],aha:elationActors.length?{turns:aha.count,punchline:aha.punchline}:null,...(checkpoints.length?{checkpoints}:{}),total,per100AV:total/horizon*100,horizon,damageByTarget,initialStats,memories:memories.map(m=>({owner:m.owner.id,name:m.name,active:m.active,hp:m.unit.currentHP,maxHP:m.baseHP?memoStat(m).hp:0,speed:m.baseHP?memoSpeed(m):0,turns:m.turn})),toughness:dummies.map(d=>({current:d.toughness,max:maxToughness,exo:d.exo,breaks:d.breaks})),breakdown:actors.map(a=>({id:a.id,damage:a.total,memoDamage:a.memoDamage||0,breakDamage:a.breakDamage||0,superDamage:a.superDamage||0,breaks:a.breakCount||0,turns:a.normal,ults:a.ults,followups:a.followups,energy:a.energy,resource:a.resource,currentHP:Math.min(a.currentHP,stat(a).hp),maxHP:stat(a).hp,shield:(a.shield?.amount||0)+(a.avenShield?.amount||0)+(a.dragonShield?.amount||0)+(a.marchShield?.amount||0)+(a.trailShield?.amount||0),recorded:a.bank||0,ode:a.ode||null,godmode:!!a.godmode,mood:a.mood||0,assistUses:a.assistUses||0,banger:banger(a),elation:elation(a),special:a.gems??a.enthusiasm??0})),events,finalSP:sp,maxSP};
  }
  function combinations(values,k){if(!Number.isInteger(k)||k<0||k>values.length)return [];const result=[];function visit(start,current){if(current.length===k){result.push(current);return;}for(let i=start;i<=values.length-(k-current.length);i++)visit(i+1,[...current,values[i]]);}visit(0,[]);return result;}
  function createSearch(core,pool,profiles,scenario,data,candidates={}){
    if(!compatible(core))throw Error('Выбери один Путь Первопроходца и одну форму Март 7.');
    validateScenario(scenario);if(!Array.isArray(core)||core.length<1||core.length>4||new Set(core).size!==core.length)throw Error('Зафиксируй от 1 до 4 разных персонажей в коре.');
    if(!Array.isArray(pool)||new Set(pool).size!==pool.length)throw Error('В пуле есть повторяющиеся персонажи.');
    for(const id of [...core,...pool])if(!models[id])throw Error('Персонаж пока не поддержан симулятором: '+(data.characters[id]?.name||id));
    const available=(pool.length?pool:Object.keys(models).filter(id=>!aliases[id])).filter(id=>!core.includes(id)).sort(),choices=combinations(available,4-core.length).filter(choice=>compatible([...core,...choice])&&(!scenario.requireSustain||[...core,...choice].some(id=>models[id].role==='sustain')));if(!choices.length)throw Error(scenario.requireSustain?'Нет допустимой команды со састейном. Добавь састейна в пул или кор и оставь ему место.':'В пуле недостаточно персонажей для команды из четырёх.');
    const options={};
    for(const id of [...new Set([...core,...available])]){
      const variants=candidates[id]||[];
      options[id]=variants.length?variants:[{profile:profiles[id]||defaults(id,data)}];
      for(const variant of options[id])validateStats(variant.profile);
    }
    const battleCount=ids=>ids.reduce((count,id)=>count*options[id].length,1);
    const total=choices.reduce((sum,choice)=>sum+battleCount([...core,...choice]),0);
    if(total>250000)throw Error('Больше 250 000 боёв. Сузь пул персонажей или список кандидатов.');
    let checked=0,rosterIndex=0,variantIndex=0,best=null;
    const top=[];
    return {total,step(batch=2){
      for(let i=0;i<batch&&checked<total;i++){
        const ids=[...core,...choices[rosterIndex]];
        let cursor=variantIndex;
        const battleProfiles={},builds={};
        for(const id of ids){
          const variants=options[id];
          const variant=variants[cursor%variants.length];
          cursor=Math.floor(cursor/variants.length);
          battleProfiles[id]=variant.profile;
          if(variant.id)builds[id]=variant.id;
        }
        const result=simulate(ids,battleProfiles,{...scenario,focus:core[0]},data);
        if(!best||result.total>best.total)best={...result,builds,profiles:battleProfiles};
        checked++;
        variantIndex++;
        if(variantIndex===battleCount(ids)){
          top.push(best);
          top.sort((a,b)=>b.total-a.total);
          if(top.length>10)top.pop();
          rosterIndex++;
          variantIndex=0;
          best=null;
        }
      }
      return {total,checked,rosters:choices.length,done:checked===total,top};
    }};
  }
  const eidolonModels=new Set(['1511','1308','1220','1309','1313','1218','1204','1213',
    '1009','1202','1303','1217','1304','1208','1225','1301','1106','1305',
    '1101','1306','1006','1104','1105','1211','1203','1003','1107','1112',
    '1002','1103','1109','1210','1108','1111','1206','1207','1215','1102',
    '1001','1004','1005','1008','1013','1205','1209','1212','1302','1310',
    '1014','1015','1110','1201','1214','1221','1222','1223','1224','1312',
    '1307','1314','1315','1317','1401','1403','1405','1406','1410','1412',
    '1321','1402','1404','1407','1408','1409','1413','1414','1415','8005',
    '1501','1502','1503','1504','1505','1506','1507','1508','1509','1510',
    '1512','1513','8001','8003','8007','8009'].filter(id=>models[id]));
  root.HSR_TEAM={models,aliases,eidolonModels,canonical,defaults,validateStats,validateScenario,simulate,combinations,createSearch,compatible};
})(typeof window==='undefined'?globalThis:window);
