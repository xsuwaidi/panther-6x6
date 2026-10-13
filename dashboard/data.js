/* Static reference data, labels (Arabic / English) and the demo seed.
   All people, units and incidents here are fictional examples for the demo. */
(function (root) {
'use strict';

const T = {
  ar: {
    app: 'مركز قيادة الحوادث', appSub: 'الدفاع المدني · الإطفاء والإنقاذ',
    pickRole: 'من أنت؟', pickRoleSub: 'اختر دورك لفتح لوحتك. يمكنك التبديل في أي وقت من الشريط العلوي.',
    rOps: 'غرفة العمليات', rOpsD: 'استقبال البلاغات وإرسال الوحدات ومتابعة الطلبات.',
    rIC: 'قائد الحادث', rICD: 'إدارة الحادث وتقسيم القطاعات وتكليف الضباط والمهام.',
    rOff: 'ضابط القطاع / المحطة', rOffD: 'رجالك ومركباتك والقطاع المكلف به ومهامك.',
    open: 'افتح', whoAreYou: 'اختر اسمك', back: 'رجوع', switchUser: 'تبديل المستخدم',
    day: 'نهاري', night: 'ليلي', lang: 'English',
    hintOps: 'لإنشاء بلاغ: اضغط نوع البلاغ ← اختر الموقع ← إرسال.',
    hintIC: 'اضغط على أي قطاع لتكليف ضابط أو إضافة مهام. الطلبات الجديدة تظهر في العمود الجانبي.',
    hintOff: 'اضغط على المهمة لتغيير حالتها. اضغط على الفرد لتحديث حالته.',
    quick: 'بلاغ سريع', incidents: 'البلاغات والحوادث', units: 'جاهزية الوحدات', requests: 'طلبات من الميدان',
    noReq: 'لا توجد طلبات جديدة', sendUnit: 'أرسل', dispatchMore: 'إرسال وحدة إضافية', assigned: 'الوحدات المكلفة',
    newIncident: 'بلاغ جديد', step1: 'نوع البلاغ', step2: 'الموقع', step3: 'درجة الخطورة', step4: 'الوحدات المقترحة',
    notes: 'ملاحظات (اختياري)', sendReport: 'إرسال البلاغ والوحدات', cancel: 'إلغاء', chooseLoc: 'اختر الموقع أولاً',
    l1: 'منخفضة', l2: 'متوسطة', l3: 'عالية', level: 'الخطورة',
    st_new: 'جديد', st_dispatched: 'تم الإرسال', st_onscene: 'في الموقع', st_control: 'تحت السيطرة', st_closed: 'مغلق',
    us_available: 'جاهزة', us_enroute: 'في الطريق', us_onscene: 'في الموقع', us_out: 'خارج الخدمة',
    ps_ok: 'جاهز', ps_rest: 'استراحة', ps_injured: 'مصاب',
    ms_todo: 'لم تبدأ', ms_doing: 'جارية', ms_done: 'منجزة',
    active: 'حادث نشط', elapsed: 'المدة', unitsOn: 'الوحدات', personnel: 'الأفراد', sectors: 'القطاعات', openMis: 'مهام مفتوحة',
    takeCmd: 'استلام القيادة', noActive: 'لا يوجد حادث نشط حالياً', pickInc: 'اختر الحادث لاستلام القيادة',
    nextStatus: 'الانتقال إلى', closeInc: 'إغلاق الحادث', declareCtl: 'إعلان السيطرة',
    assignOff: 'تعيين ضابط', officer: 'الضابط', noOfficer: 'بدون ضابط', addSector: 'إضافة قطاع', missions: 'المهام',
    addMission: 'أضف مهمة بضغطة', sectorUnits: 'وحدات القطاع', freeUnits: 'وحدات غير موزعة', remove: 'إزالة القطاع',
    actions: 'إجراءات القائد', reqUnits: 'طلب وحدات إضافية', par: 'حصر الأفراد (PAR)', parSent: 'تم طلب حصر الأفراد',
    parOk: 'الكل بخير', parWait: 'بانتظار', log: 'سجل الاتصالات', addNote: 'أضف ملاحظة…', send: 'إرسال',
    reqKind: 'ماذا تحتاج؟', support: 'طلب دعم', mayday: 'استغاثة MAYDAY', maydayConfirm: 'اضغط مرة أخرى للتأكيد',
    maydayAck: 'تم الاستلام', maydayFrom: 'نداء استغاثة من',
    yourSector: 'قطاعك', incident: 'الحادث', commander: 'القائد', noAssign: 'لا يوجد تكليف حالياً',
    noAssignD: 'محطتك في وضع الجاهزية. ستظهر هنا أي مهمة يكلفك بها قائد الحادث.',
    myMen: 'رجالي', myVehicles: 'مركباتي', myMissions: 'مهامي', noMissions: 'لا توجد مهام بعد',
    water: 'الماء', station: 'المحطة', reset: 'إعادة العرض التجريبي', demo: 'بيانات تجريبية',
    sent: 'تم الإرسال', done: 'تم', arrived: 'وصلت إلى الموقع', dispatchedTo: 'أرسلت إلى',
    syncNote: 'افتح اللوحات في تبويبات مختلفة على نفس الجهاز لتجربة التواصل بين الأدوار.',
    stats_active: 'حوادث نشطة', stats_avail: 'وحدات جاهزة', stats_busy: 'وحدات مشغولة', stats_req: 'طلبات مفتوحة',
    other: 'موقع آخر', min: 'د', sectorOf: 'قطاع', minutesAgo: 'منذ', fulfil: 'إرسال', noneAvail: 'لا توجد وحدة جاهزة'
  },
  en: {
    app: 'Incident Command', appSub: 'Civil Defence · Fire & Rescue',
    pickRole: 'Who are you?', pickRoleSub: 'Choose your role to open your dashboard. You can switch at any time from the top bar.',
    rOps: 'Operations Room', rOpsD: 'Receive calls, dispatch units and handle field requests.',
    rIC: 'Incident Commander', rICD: 'Run the incident, create sectors, assign officers and missions.',
    rOff: 'Sector / Station Officer', rOffD: 'Your crew, your vehicles, your sector and your missions.',
    open: 'Open', whoAreYou: 'Choose your name', back: 'Back', switchUser: 'Switch user',
    day: 'Day', night: 'Night', lang: 'العربية',
    hintOps: 'To report: tap the incident type → choose the location → Send.',
    hintIC: 'Tap any sector to assign an officer or add missions. New requests appear in the side column.',
    hintOff: 'Tap a mission to change its status. Tap a crew member to update their status.',
    quick: 'Quick report', incidents: 'Calls & incidents', units: 'Unit readiness', requests: 'Requests from the field',
    noReq: 'No new requests', sendUnit: 'Send', dispatchMore: 'Send another unit', assigned: 'Assigned units',
    newIncident: 'New incident', step1: 'Incident type', step2: 'Location', step3: 'Severity', step4: 'Suggested units',
    notes: 'Notes (optional)', sendReport: 'Send report and units', cancel: 'Cancel', chooseLoc: 'Choose a location first',
    l1: 'Low', l2: 'Medium', l3: 'High', level: 'Severity',
    st_new: 'New', st_dispatched: 'Dispatched', st_onscene: 'On scene', st_control: 'Under control', st_closed: 'Closed',
    us_available: 'Available', us_enroute: 'En route', us_onscene: 'On scene', us_out: 'Out of service',
    ps_ok: 'Ready', ps_rest: 'Resting', ps_injured: 'Injured',
    ms_todo: 'Not started', ms_doing: 'In progress', ms_done: 'Done',
    active: 'Active incident', elapsed: 'Elapsed', unitsOn: 'Units', personnel: 'Personnel', sectors: 'Sectors', openMis: 'Open missions',
    takeCmd: 'Take command', noActive: 'No active incident right now', pickInc: 'Choose the incident to command',
    nextStatus: 'Move to', closeInc: 'Close incident', declareCtl: 'Declare under control',
    assignOff: 'Assign officer', officer: 'Officer', noOfficer: 'No officer', addSector: 'Add sector', missions: 'Missions',
    addMission: 'Add a mission in one tap', sectorUnits: 'Sector units', freeUnits: 'Unassigned units', remove: 'Remove sector',
    actions: 'Commander actions', reqUnits: 'Request more units', par: 'Personnel check (PAR)', parSent: 'Personnel check requested',
    parOk: 'All accounted for', parWait: 'Waiting', log: 'Communications log', addNote: 'Add a note…', send: 'Send',
    reqKind: 'What do you need?', support: 'Request support', mayday: 'MAYDAY', maydayConfirm: 'Tap again to confirm',
    maydayAck: 'Acknowledge', maydayFrom: 'Mayday from',
    yourSector: 'Your sector', incident: 'Incident', commander: 'Commander', noAssign: 'No assignment right now',
    noAssignD: 'Your station is on standby. Any task the incident commander gives you will appear here.',
    myMen: 'My crew', myVehicles: 'My vehicles', myMissions: 'My missions', noMissions: 'No missions yet',
    water: 'Water', station: 'Station', reset: 'Reset demo', demo: 'Demo data',
    sent: 'Sent', done: 'Done', arrived: 'arrived on scene', dispatchedTo: 'dispatched to',
    syncNote: 'Open the dashboards in separate tabs on the same device to try the hand-offs between roles.',
    stats_active: 'Active incidents', stats_avail: 'Units available', stats_busy: 'Units committed', stats_req: 'Open requests',
    other: 'Other location', min: 'min', sectorOf: 'Sector', minutesAgo: 'ago', fulfil: 'Send', noneAvail: 'No unit available'
  }
};

// incident types → icon + the unit kinds recommended for a first response
const TYPES = {
  aircraft: { ar: 'حادث طائرة', en: 'Aircraft incident', icon: 'plane', kinds: ['arff', 'arff', 'rescue', 'ambulance', 'command'] },
  fire: { ar: 'حريق مبنى', en: 'Building fire', icon: 'fire', kinds: ['engine', 'tanker', 'rescue', 'ambulance'] },
  hazmat: { ar: 'مواد خطرة', en: 'Hazardous materials', icon: 'hazmat', kinds: ['hazmat', 'arff', 'ambulance'] },
  fuel: { ar: 'تسرب وقود', en: 'Fuel spill', icon: 'drop', kinds: ['arff', 'hazmat'] },
  rescue: { ar: 'إنقاذ', en: 'Rescue', icon: 'rescue', kinds: ['rescue', 'ambulance'] },
  medical: { ar: 'حالة إسعافية', en: 'Medical', icon: 'medical', kinds: ['ambulance'] }
};
const LOCS = [
  { id: 'h3', ar: 'حظيرة الطائرات 3', en: 'Hangar 3' }, { id: 'rw27', ar: 'المدرج 27', en: 'Runway 27' },
  { id: 't1', ar: 'مبنى الركاب 1', en: 'Terminal 1' }, { id: 'apb', ar: 'ساحة الطائرات B', en: 'Apron B' },
  { id: 'fuel', ar: 'مستودع الوقود', en: 'Fuel farm' }, { id: 'cargo', ar: 'قرية الشحن', en: 'Cargo village' }
];
const KINDS = {
  arff: { ar: 'إطفاء مطارات', en: 'ARFF' }, engine: { ar: 'إطفاء', en: 'Engine' }, tanker: { ar: 'صهريج مياه', en: 'Water tanker' },
  rescue: { ar: 'إنقاذ', en: 'Rescue' }, hazmat: { ar: 'مواد خطرة', en: 'HazMat' }, ambulance: { ar: 'إسعاف', en: 'Ambulance' },
  command: { ar: 'قيادة', en: 'Command' }
};
// sector presets with one-tap mission suggestions
const SECTORS = {
  attack: { ar: 'الهجوم', en: 'Attack', icon: 'fire', missions: [['تغطية الانسكاب بطبقة رغوة', 'Foam blanket over the spill'], ['تبريد البراميل', 'Cool the drums'], ['بحث داخل الحظيرة', 'Search inside the hangar'], ['مراقبة إعادة الاشتعال', 'Watch for re-ignition']] },
  water: { ar: 'إمداد المياه', en: 'Water supply', icon: 'drop', missions: [['تأمين مصدر مياه (حنفية)', 'Secure a hydrant'], ['إعادة تعبئة بانثر 1', 'Refill Panther 1'], ['مد خط تغذية', 'Lay a supply line']] },
  hazmat: { ar: 'المواد الخطرة', en: 'HazMat', icon: 'hazmat', missions: [['إنشاء ممر إزالة التلوث', 'Set up the decon corridor'], ['تحديد المادة (رقم UN)', 'Identify the product (UN number)'], ['إيقاف التسرب', 'Stop the leak'], ['قياس الأبخرة', 'Monitor vapours']] },
  rescue: { ar: 'الإنقاذ', en: 'Rescue', icon: 'rescue', missions: [['بحث وإنقاذ', 'Search and rescue'], ['فتح ممر آمن', 'Open a safe route'], ['إخلاء الموظفين', 'Evacuate staff']] },
  medical: { ar: 'الإسعاف', en: 'Medical', icon: 'medical', missions: [['إنشاء نقطة فرز المصابين', 'Set up a triage point'], ['نقل المصابين', 'Transport casualties']] },
  exposure: { ar: 'الحماية والتبريد', en: 'Exposures', icon: 'shield', missions: [['تبريد الطائرة المجاورة', 'Cool the adjacent aircraft'], ['حماية المبنى المجاور', 'Protect the next building']] },
  logistics: { ar: 'الإمداد', en: 'Logistics', icon: 'truck', missions: [['تبديل أسطوانات التنفس', 'Swap SCBA cylinders'], ['استراحة وتأهيل الأفراد', 'Crew rest and rehab']] }
};
const REQ_KINDS = ['arff', 'tanker', 'rescue', 'hazmat', 'ambulance', 'engine'];
const SUPPORT = [
  { id: 'water', ar: 'مياه', en: 'Water' }, { id: 'men', ar: 'أفراد', en: 'More crew' },
  { id: 'med', ar: 'إسعاف', en: 'Medical' }, { id: 'air', ar: 'أسطوانات تنفس', en: 'SCBA air' }
];

function seed() {
  const now = Date.now(), m = 60000;
  const stations = [
    { id: 'S1', ar: 'محطة 1 · المطار', en: 'Station 1 · Airport' },
    { id: 'S2', ar: 'محطة 2 · الجنوبية', en: 'Station 2 · South' },
    { id: 'S3', ar: 'محطة 3 · الشحن', en: 'Station 3 · Cargo' }
  ];
  const officers = [
    { id: 'O1', ar: 'م. أول خالد المنصوري', en: '1st Lt. Khalid Al Mansouri', st: 'S1' },
    { id: 'O2', ar: 'نقيب سالم الكعبي', en: 'Capt. Salem Al Kaabi', st: 'S2' },
    { id: 'O3', ar: 'م. راشد الظاهري', en: 'Lt. Rashed Al Dhaheri', st: 'S3' },
    { id: 'O4', ar: 'م. أول مريم النعيمي', en: '1st Lt. Mariam Al Nuaimi', st: 'S1' }
  ];
  const units = [
    { id: 'P1', cs: 'Panther 1', kind: 'arff', st: 'S1', status: 'onscene', water: 64, cap: 12500 },
    { id: 'P2', cs: 'Panther 2', kind: 'arff', st: 'S1', status: 'onscene', water: 81, cap: 12500 },
    { id: 'R1', cs: 'Rescue 1', kind: 'rescue', st: 'S1', status: 'onscene' },
    { id: 'C1', cs: 'Command 1', kind: 'command', st: 'S1', status: 'onscene' },
    { id: 'E2', cs: 'Engine 2', kind: 'engine', st: 'S2', status: 'available', water: 100, cap: 4000 },
    { id: 'T2', cs: 'Tanker 2', kind: 'tanker', st: 'S2', status: 'available', water: 100, cap: 20000 },
    { id: 'H3', cs: 'HazMat 3', kind: 'hazmat', st: 'S3', status: 'onscene' },
    { id: 'A3', cs: 'Ambulance 3', kind: 'ambulance', st: 'S3', status: 'enroute', since: now - .4 * m },
    { id: 'P3', cs: 'Panther 3', kind: 'arff', st: 'S3', status: 'available', water: 100, cap: 12500 }
  ];
  const first = [['أحمد', 'Ahmed'], ['سعيد', 'Saeed'], ['حمد', 'Hamad'], ['يوسف', 'Yousef'], ['علي', 'Ali'], ['عمر', 'Omar'], ['ماجد', 'Majed'], ['فهد', 'Fahad'], ['سيف', 'Saif'], ['هزاع', 'Hazza'], ['مبارك', 'Mubarak'], ['عبدالله', 'Abdulla'], ['جاسم', 'Jassim'], ['بدر', 'Badr'], ['راشد', 'Rashid'], ['ناصر', 'Nasser'], ['خليفة', 'Khalifa'], ['منصور', 'Mansour'], ['طارق', 'Tariq'], ['حميد', 'Humaid'], ['سلطان', 'Sultan'], ['زايد', 'Zayed'], ['وليد', 'Waleed'], ['عيسى', 'Eisa'], ['مروان', 'Marwan'], ['أنور', 'Anwar'], ['نواف', 'Nawaf'], ['غانم', 'Ghanem']];
  const ranks = [['رقيب', 'Sgt.'], ['عريف', 'Cpl.'], ['إطفائي', 'FF'], ['إطفائي', 'FF']];
  const crewSize = { arff: 4, rescue: 3, command: 2, engine: 4, tanker: 2, hazmat: 4, ambulance: 2 };
  const people = []; let k = 0;
  units.forEach(u => { for (let i = 0; i < crewSize[u.kind]; i++) { const f = first[k % first.length], r = ranks[Math.min(i, 3)]; people.push({ id: 'M' + (++k), ar: r[0] + ' ' + f[0], en: r[1] + ' ' + f[1], unit: u.id, status: 'ok', role: i === 0 ? 'lead' : '' }); } });
  people.find(p => p.unit === 'P1' && !p.role).status = 'rest';

  const inc = {
    id: 'INC-0471', type: 'hazmat', loc: 'h3', level: 3, status: 'onscene', created: now - 18 * m,
    ar: 'حريق في حظيرة الطائرات 3 مع تسرب براميل مواد خطرة', en: 'Hangar 3 fire with leaking hazardous drums',
    commander: 'IC1', units: ['P1', 'P2', 'R1', 'C1', 'H3', 'A3'],
    sectors: [
      { id: 'sA', key: 'attack', officer: 'O1', units: ['P1', 'P2'], missions: [
        { id: 'm1', ar: 'تغطية الانسكاب بطبقة رغوة', en: 'Foam blanket over the spill', s: 'done' },
        { id: 'm2', ar: 'تبريد البراميل', en: 'Cool the drums', s: 'doing' },
        { id: 'm3', ar: 'مراقبة إعادة الاشتعال', en: 'Watch for re-ignition', s: 'todo' }] },
      { id: 'sB', key: 'hazmat', officer: 'O3', units: ['H3'], missions: [
        { id: 'm4', ar: 'إنشاء ممر إزالة التلوث', en: 'Set up the decon corridor', s: 'done' },
        { id: 'm5', ar: 'تحديد المادة (رقم UN)', en: 'Identify the product (UN number)', s: 'done' },
        { id: 'm6', ar: 'إيقاف التسرب', en: 'Stop the leak', s: 'doing' }] },
      { id: 'sC', key: 'rescue', officer: null, units: ['R1'], missions: [
        { id: 'm7', ar: 'بحث داخل الحظيرة', en: 'Search inside the hangar', s: 'todo' }] }
    ],
    requests: [{ id: 'q1', kind: 'tanker', from: 'IC1', at: now - 3 * m, status: 'open' }],
    par: null, mayday: null,
    log: [
      { t: now - 18 * m, w: 'ops', ar: 'استلام بلاغ من برج المراقبة: حريق في الحظيرة 3 مع تسرب مواد خطرة.', en: 'Call from the tower: fire in Hangar 3 with a hazardous leak.' },
      { t: now - 17 * m, w: 'ops', ar: 'إرسال Panther 1 و Panther 2 و Rescue 1 و Command 1.', en: 'Dispatched Panther 1, Panther 2, Rescue 1 and Command 1.' },
      { t: now - 15 * m, w: 'IC1', ar: 'وصلنا الموقع. التمركز عكس الريح. استلام القيادة.', en: 'On scene. Positioned upwind. Taking command.' },
      { t: now - 12 * m, w: 'O1', ar: 'بدء الهجوم بالرغوة على الانسكاب.', en: 'Foam attack on the spill started.' },
      { t: now - 7 * m, w: 'O3', ar: 'المادة: بنزين UN 1203. ممر إزالة التلوث جاهز.', en: 'Product: gasoline UN 1203. Decon corridor ready.' },
      { t: now - 3 * m, w: 'IC1', ar: 'طلب صهريج مياه إضافي.', en: 'Requested an extra water tanker.' }
    ]
  };
  const inc2 = {
    id: 'INC-0472', type: 'medical', loc: 't1', level: 1, status: 'new', created: now - 1.5 * m,
    ar: 'مسافر فاقد للوعي عند البوابة 12', en: 'Unconscious passenger at gate 12',
    commander: null, units: [], sectors: [], requests: [], par: null, mayday: null,
    log: [{ t: now - 1.5 * m, w: 'ops', ar: 'بلاغ من أمن المبنى 1: مسافر فاقد للوعي عند البوابة 12.', en: 'Call from Terminal 1 security: unconscious passenger at gate 12.' }]
  };
  return {
    v: 1, seq: 473, stations, officers, units, people,
    staff: { IC1: { ar: 'مقدم أحمد الشامسي', en: 'Lt. Col. Ahmed Al Shamsi' }, ops: { ar: 'غرفة العمليات', en: 'Operations' } },
    incidents: [inc, inc2]
  };
}

root.ICD = { T, TYPES, LOCS, KINDS, SECTORS, REQ_KINDS, SUPPORT, seed };
})(typeof window !== 'undefined' ? window : this);
