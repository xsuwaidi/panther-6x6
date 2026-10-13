/* Reference data, labels (Arabic / English) and the demo seed for the Incident Command dashboard.
   Stations, areas, vehicle types and first-alarm plans follow the Ajman Civil Defence operations-room app.
   People, incidents and reports are fictional demo examples. */
(function (root) {
'use strict';

const T = {
  ar: {
    app: 'مركز قيادة الحوادث', appSub: 'الدفاع المدني · عجمان',
    pickRole: 'من أنت؟', pickRoleSub: 'اختر دورك لفتح لوحتك. يمكنك التبديل في أي وقت من الشريط العلوي.',
    rOps: 'غرفة العمليات', rOpsD: 'استقبال البلاغات وإرسال الآليات ومتابعة الطلبات.',
    rIC: 'قائد الحادث', rICD: 'إدارة الحادث وتقسيم القطاعات وتكليف الضباط والمهام.',
    rOff: 'ضابط القطاع / المركز', rOffD: 'رجالك وآلياتك والقطاع المكلف به ومهامك.',
    open: 'افتح', whoAreYou: 'اختر اسمك', back: 'رجوع', switchUser: 'تبديل المستخدم',
    day: 'نهاري', night: 'ليلي', lang: 'English',
    hintOps: 'لإرسال بلاغ: اضغط نوع البلاغ ← اختر المنطقة ← إرسال.',
    hintIC: 'اضغط على أي قطاع لتكليف ضابط أو آليات أو مهام. التنبيهات والطلبات تظهر في العمود الجانبي.',
    hintOff: 'اضغط زر المهمة لتغيير حالتها. اضغط زر المضخة لتشغيلها أو إيقافها.',
    quick: 'بلاغ سريع', incoming: 'بلاغات واردة', incidents: 'الحوادث النشطة', units: 'جاهزية الآليات', requests: 'طلبات من الميدان',
    noReq: 'لا توجد طلبات جديدة', noReports: 'لا توجد بلاغات جديدة', assigned: 'الآليات المكلفة', dispatchMore: 'إرسال آلية إضافية',
    newIncident: 'بلاغ جديد', step1: 'نوع البلاغ', step2: 'المنطقة', step3: 'الخطورة', step4: 'الآليات المقترحة (الأقرب)',
    more: 'تفاصيل إضافية (اختياري)', location: 'العنوان', caller: 'المبلّغ', trapped: 'محتجزون', injuries: 'إصابات',
    sendReport: 'إرسال البلاغ والآليات', cancel: 'إلغاء', chooseLoc: 'اختر المنطقة أولاً', reject: 'مكرر', dispatchRep: 'إرسال',
    sev_low: 'منخفضة', sev_med: 'متوسطة', sev_high: 'عالية', sev_crit: 'حرجة', level: 'الخطورة',
    st_dispatched: 'تم الإرسال', st_onscene: 'في الموقع', st_control: 'تحت السيطرة', st_closed: 'مغلق',
    us_available: 'متاحة', us_enroute: 'في الطريق', us_onscene: 'في الموقع', us_pump: 'تضخ الآن', us_out: 'خارج الخدمة',
    ps_duty: 'مناوب', ps_field: 'في الميدان', ps_injured: 'مصاب',
    ms_todo: 'لم تبدأ', ms_doing: 'جارية', ms_done: 'منجزة',
    ss_crit: 'حرج جداً', ss_active: 'اشتباك نشط', ss_stable: 'مستقر', ss_ctrl: 'تحت السيطرة',
    active: 'حادث نشط', elapsed: 'المدة', unitsOn: 'الآليات', personnel: 'الأفراد', sectors: 'القطاعات', openMis: 'مهام مفتوحة',
    contain: 'الاحتواء', wind: 'الرياح', hazmat: 'HAZMAT', temp: 'الحرارة', flow: 'التدفق', waterOn: 'مياه بالموقع',
    takeCmd: 'استلام القيادة', noActive: 'لا يوجد حادث نشط حالياً', pickInc: 'اختر الحادث لاستلام القيادة',
    nextStatus: 'الانتقال إلى',
    assignOff: 'تعيين ضابط', addSector: 'إضافة قطاع', missions: 'المهام', status: 'الحالة', channel: 'القناة',
    addMission: 'أضف مهمة بضغطة', sectorUnits: 'آليات القطاع', freeUnits: 'آليات في منطقة التجمع', remove: 'إزالة القطاع',
    actions: 'إجراءات القائد', reqUnits: 'طلب آليات إضافية', par: 'حصر الأفراد (PAR)', parSent: 'تم طلب حصر الأفراد',
    parOk: 'الكل بخير', parWait: 'بانتظار', log: 'سجل الاتصالات', addNote: 'أضف ملاحظة…', send: 'إرسال',
    reqKind: 'ماذا تحتاج؟', support: 'طلب دعم', mayday: 'استغاثة MAYDAY', maydayConfirm: 'اضغط مرة أخرى للتأكيد',
    maydayAck: 'تم الاستلام', maydayFrom: 'نداء استغاثة من', alerts: 'تنبيهات السلامة', noAlerts: 'لا توجد تنبيهات',
    yourSector: 'قطاعك', incident: 'الحادث', commander: 'القائد', noAssign: 'لا يوجد تكليف حالياً',
    noAssignD: 'مجموعتك في وضع الجاهزية. ستظهر هنا أي مهمة يكلفك بها قائد الحادث.',
    myMen: 'رجالي', myVehicles: 'آلياتي', myMissions: 'مهامي', noMissions: 'لا توجد مهام بعد', group: 'المجموعة',
    water: 'المياه', foam: 'الرغوة', toEmpty: 'يكفي', pumpOn: 'تشغيل المضخة', pumpOff: 'إيقاف المضخة',
    air: 'الهواء', swap: 'تبديل الأسطوانة', reset: 'إعادة العرض التجريبي',
    sent: 'تم الإرسال', done: 'تم', dispatchedTo: 'أُرسلت إلى', eta: 'الوصول',
    syncOn: 'متزامن بين الأجهزة', syncLocal: 'متزامن بين التبويبات على هذا الجهاز',
    stats_reports: 'بلاغات جديدة', stats_active: 'حوادث نشطة', stats_avail: 'آليات متاحة', stats_req: 'طلبات مفتوحة',
    fulfil: 'إرسال', noneAvail: 'لا توجد آلية متاحة', min: 'د', speedNote: 'العرض التجريبي مسرّع: التنقل ×10، استهلاك المياه ×2، هواء الأسطوانات ×3.',
    side: 'الجهة', core: 'موقع الحادث', withdraw: 'انسحاب فوري', lowAir: 'هواء منخفض'
  },
  en: {
    app: 'Incident Command', appSub: 'Civil Defence · Ajman',
    pickRole: 'Who are you?', pickRoleSub: 'Choose your role to open your dashboard. You can switch at any time from the top bar.',
    rOps: 'Operations Room', rOpsD: 'Take calls, dispatch vehicles and handle field requests.',
    rIC: 'Incident Commander', rICD: 'Run the incident, create sectors, assign officers and missions.',
    rOff: 'Sector / Station Officer', rOffD: 'Your crew, your vehicles, your sector and your missions.',
    open: 'Open', whoAreYou: 'Choose your name', back: 'Back', switchUser: 'Switch user',
    day: 'Day', night: 'Night', lang: 'العربية',
    hintOps: 'To send a report: tap the incident type → choose the area → Send.',
    hintIC: 'Tap any sector to assign an officer, vehicles or missions. Alerts and requests appear in the side column.',
    hintOff: 'Tap a mission button to change its status. Tap the pump button to start or stop pumping.',
    quick: 'Quick report', incoming: 'Incoming calls', incidents: 'Active incidents', units: 'Vehicle readiness', requests: 'Requests from the field',
    noReq: 'No new requests', noReports: 'No new calls', assigned: 'Assigned vehicles', dispatchMore: 'Send another vehicle',
    newIncident: 'New report', step1: 'Incident type', step2: 'Area', step3: 'Severity', step4: 'Suggested vehicles (nearest)',
    more: 'More details (optional)', location: 'Address', caller: 'Caller', trapped: 'Trapped', injuries: 'Injuries',
    sendReport: 'Send report and vehicles', cancel: 'Cancel', chooseLoc: 'Choose an area first', reject: 'Duplicate', dispatchRep: 'Dispatch',
    sev_low: 'Low', sev_med: 'Medium', sev_high: 'High', sev_crit: 'Critical', level: 'Severity',
    st_dispatched: 'Dispatched', st_onscene: 'On scene', st_control: 'Under control', st_closed: 'Closed',
    us_available: 'Available', us_enroute: 'En route', us_onscene: 'On scene', us_pump: 'Pumping', us_out: 'Out of service',
    ps_duty: 'On duty', ps_field: 'In the field', ps_injured: 'Injured',
    ms_todo: 'Not started', ms_doing: 'In progress', ms_done: 'Done',
    ss_crit: 'Critical', ss_active: 'Active attack', ss_stable: 'Stable', ss_ctrl: 'Under control',
    active: 'Active incident', elapsed: 'Elapsed', unitsOn: 'Vehicles', personnel: 'Personnel', sectors: 'Sectors', openMis: 'Open missions',
    contain: 'Containment', wind: 'Wind', hazmat: 'HAZMAT', temp: 'Heat', flow: 'Flow', waterOn: 'Water on scene',
    takeCmd: 'Take command', noActive: 'No active incident right now', pickInc: 'Choose the incident to command',
    nextStatus: 'Move to',
    assignOff: 'Assign officer', addSector: 'Add sector', missions: 'Missions', status: 'Status', channel: 'Channel',
    addMission: 'Add a mission in one tap', sectorUnits: 'Sector vehicles', freeUnits: 'Vehicles at staging', remove: 'Remove sector',
    actions: 'Commander actions', reqUnits: 'Request more vehicles', par: 'Personnel check (PAR)', parSent: 'Personnel check requested',
    parOk: 'All accounted for', parWait: 'Waiting', log: 'Communications log', addNote: 'Add a note…', send: 'Send',
    reqKind: 'What do you need?', support: 'Request support', mayday: 'MAYDAY', maydayConfirm: 'Tap again to confirm',
    maydayAck: 'Acknowledge', maydayFrom: 'Mayday from', alerts: 'Safety alerts', noAlerts: 'No alerts',
    yourSector: 'Your sector', incident: 'Incident', commander: 'Commander', noAssign: 'No assignment right now',
    noAssignD: 'Your group is on standby. Any task the incident commander gives you will appear here.',
    myMen: 'My crew', myVehicles: 'My vehicles', myMissions: 'My missions', noMissions: 'No missions yet', group: 'Group',
    water: 'Water', foam: 'Foam', toEmpty: 'Lasts', pumpOn: 'Start pump', pumpOff: 'Stop pump',
    air: 'Air', swap: 'Swap cylinder', reset: 'Reset demo',
    sent: 'Sent', done: 'Done', dispatchedTo: 'dispatched to', eta: 'ETA',
    syncOn: 'Synced across devices', syncLocal: 'Synced across tabs on this device',
    stats_reports: 'New calls', stats_active: 'Active incidents', stats_avail: 'Vehicles available', stats_req: 'Open requests',
    fulfil: 'Send', noneAvail: 'No vehicle available', min: 'min', speedNote: 'Demo is sped up: travel ×10, water use ×2, cylinder air ×3.',
    side: 'Side', core: 'Incident', withdraw: 'Withdraw now', lowAir: 'Low air'
  }
};

const VTYPES = {
  firetruck: { ar: 'آلية إطفاء', en: 'Fire engine', water: 4000, foam: 400, flow: 475 },
  ladder: { ar: 'سلم هيدروليكي', en: 'Aerial ladder', water: 2000, foam: 200, flow: 1900 },
  responder: { ar: 'استجابة أولى', en: 'First responder', water: 500, foam: 50, flow: 230 },
  tanker: { ar: 'صهريج مياه', en: 'Water tanker', water: 12000, foam: 1000, flow: 950 }
};
// incident types → icon + first-alarm plan (vehicle types sent by default) + default severity
const TYPES = {
  building: { ar: 'حريق مبنى', en: 'Building fire', icon: 'fire', plan: ['firetruck', 'firetruck', 'ladder'], sev: 'high', fire: true },
  industrial: { ar: 'حريق صناعي / مستودعات', en: 'Industrial / warehouse fire', icon: 'factory', plan: ['firetruck', 'firetruck', 'tanker', 'ladder'], sev: 'high', fire: true },
  vehicle: { ar: 'حريق مركبة', en: 'Vehicle fire', icon: 'car', plan: ['firetruck'], sev: 'med', fire: true },
  gas: { ar: 'تسرب غاز', en: 'Gas leak', icon: 'gas', plan: ['firetruck', 'responder'], sev: 'med' },
  hazmat: { ar: 'مواد خطرة', en: 'Hazardous materials', icon: 'hazmat', plan: ['firetruck', 'tanker', 'responder'], sev: 'high', fire: true },
  traffic: { ar: 'حادث مروري', en: 'Traffic collision', icon: 'car', plan: ['responder', 'firetruck'], sev: 'med' },
  rescue: { ar: 'إنقاذ فني', en: 'Technical rescue', icon: 'rescue', plan: ['responder', 'ladder'], sev: 'med' },
  marine: { ar: 'بحث وإنقاذ بحري', en: 'Marine search & rescue', icon: 'wave', plan: ['responder'], sev: 'high' }
};
const AREAS = {
  zorah: { ar: 'الزوراء', en: 'Al Zorah', pos: [150, 42] }, port: { ar: 'ميناء عجمان', en: 'Ajman Port', pos: [118, 96] },
  corniche: { ar: 'الكورنيش', en: 'Corniche', pos: [100, 188] }, nuaimiya: { ar: 'النعيمية', en: 'Al Nuaimiya', pos: [165, 158] },
  rashidiya: { ar: 'الراشدية', en: 'Al Rashidiya', pos: [150, 244] }, jurf: { ar: 'الجرف الصناعية', en: 'Al Jurf Industrial', pos: [292, 88] },
  mowaihat: { ar: 'المويهات', en: 'Al Mowaihat', pos: [322, 160] }, hamidiya: { ar: 'الحميدية', en: 'Al Hamidiya', pos: [280, 222] },
  rawda: { ar: 'الروضة', en: 'Al Rawda', pos: [222, 300] }, amerah: { ar: 'العامرة', en: 'Al Amerah', pos: [348, 276] },
  manama: { ar: 'المنامة', en: 'Manama', pos: [500, 92] }, masfout: { ar: 'مصفوت', en: 'Masfout', pos: [566, 322] }
};
const ROLES = {
  leader: { ar: 'قائد المجموعة', en: 'Group leader' }, vice: { ar: 'نائب القائد', en: 'Deputy' },
  driver: { ar: 'سائق', en: 'Driver' }, breacher: { ar: 'اقتحام', en: 'Entry team' }, water: { ar: 'إمداد المياه', en: 'Water supply' }
};
const HAZ = { gas: { ar: 'غاز', en: 'Gas' }, chem: { ar: 'كيميائية', en: 'Chemicals' }, elec: { ar: 'كهرباء', en: 'Electrical' }, spread: { ar: 'خطر امتداد', en: 'Spread risk' }, crowd: { ar: 'تجمع أشخاص', en: 'Crowd' } };
const SIDES = { A: { ar: 'أ · الشمالي', en: 'A · North' }, B: { ar: 'ب · الشرقي', en: 'B · East' }, C: { ar: 'ج · الجنوبي', en: 'C · South' }, D: { ar: 'د · الغربي', en: 'D · West' } };
// sector presets: a side of the building, water supply or the rapid intervention team, each with one-tap missions
const SECTORS = {
  A: { ar: 'القطاع أ (الشمالي)', en: 'Sector A (North)', icon: 'fire', side: 'A', ch: 'TAC-1' },
  B: { ar: 'القطاع ب (الشرقي)', en: 'Sector B (East)', icon: 'fire', side: 'B', ch: 'TAC-2' },
  C: { ar: 'القطاع ج (الجنوبي)', en: 'Sector C (South)', icon: 'fire', side: 'C', ch: 'TAC-3' },
  D: { ar: 'القطاع د (الغربي)', en: 'Sector D (West)', icon: 'fire', side: 'D', ch: 'TAC-4' },
  water: { ar: 'قطاع إمداد المياه', en: 'Water supply', icon: 'drop', ch: 'WATER' },
  rit: { ar: 'فريق التدخل السريع (RIT)', en: 'Rapid intervention (RIT)', icon: 'rescue', ch: 'TAC-5' },
  work: { ar: 'منطقة العمل', en: 'Work area', icon: 'rescue', side: 'A', ch: 'TAC-1' },
  safety: { ar: 'السلامة والتأمين', en: 'Safety & cordon', icon: 'shield', ch: 'TAC-2' }
};
const MISSIONS = {
  side: [['الاقتحام الداخلي والبحث الأولي', 'Interior attack and primary search'], ['حماية المبنى المجاور', 'Protect the adjacent building'], ['خط دفاعي عند منطقة التحميل', 'Defensive line at the loading bay'], ['تهوية السقف', 'Roof ventilation'], ['مراقبة الامتداد', 'Watch for fire spread']],
  water: [['تشغيل الصهاريج والربط مع الحنفيات', 'Run tankers and connect hydrants'], ['مد خط تغذية رئيسي', 'Lay the main supply line'], ['إعادة تعبئة الآليات', 'Refill the engines']],
  rit: [['جاهزية لإنقاذ الإطفائيين', 'Stand by to rescue firefighters'], ['تجهيز معدات الإنقاذ', 'Stage rescue equipment']],
  work: [['تحرير المحتجزين', 'Free trapped people'], ['تثبيت المركبة', 'Stabilise the vehicle'], ['الإسعافات الأولية', 'First aid']],
  safety: [['تأمين المحيط والمسار', 'Secure the cordon and route'], ['التحكم بالمرور', 'Traffic control']]
};
const misKind = k => (k === 'A' || k === 'B' || k === 'C' || k === 'D') ? 'side' : k;
const REQ_KINDS = ['firetruck', 'ladder', 'tanker', 'responder'];
const SUPPORT = [{ id: 'water', ar: 'مياه', en: 'Water' }, { id: 'men', ar: 'أفراد', en: 'More crew' }, { id: 'med', ar: 'إسعاف', en: 'Ambulance' }, { id: 'air', ar: 'أسطوانات تنفس', en: 'SCBA cylinders' }];
const AIR_CAP = 1800; // ≈ litres of air in a 6.8 L cylinder at 300 bar

function seed() {
  const now = Date.now(), m = 60000;
  let n = 0; const uid = p => p + (++n).toString(36);
  const stations = [
    { id: 'S1', ar: 'مركز الإدارة', en: 'HQ Station', area: 'nuaimiya', pos: [206, 186], duty: 'A', color: '#d3202c' },
    { id: 'S2', ar: 'مركز الجرف', en: 'Al Jurf Station', area: 'jurf', pos: [262, 118], duty: 'B', color: '#e5730c' },
    { id: 'S3', ar: 'مركز الراشدية', en: 'Al Rashidiya Station', area: 'rashidiya', pos: [128, 262], duty: 'A', color: '#0e9688' },
    { id: 'S4', ar: 'نقطة البحث والإنقاذ البحري', en: 'Marine SAR Point', area: 'port', pos: [96, 128], duty: 'C', color: '#1a8fc4' },
    { id: 'S5', ar: 'مركز مصفوت', en: 'Masfout Station', area: 'masfout', pos: [548, 300], duty: 'B', color: '#4b58d2' },
    { id: 'S6', ar: 'مركز المنامة', en: 'Manama Station', area: 'manama', pos: [470, 118], duty: 'A', color: '#c2378f' }
  ];
  // the duty group of each station; its group leader is the station officer
  const FN = [['سعيد', 'Saeed'], ['حمد', 'Hamad'], ['عمر', 'Omar'], ['راشد', 'Rashed'], ['ناصر', 'Nasser'], ['خالد', 'Khalid'], ['سالم', 'Salem'], ['علي', 'Ali'], ['يوسف', 'Yousef'], ['سلطان', 'Sultan'], ['ماجد', 'Majed'], ['مبارك', 'Mubarak'], ['عيسى', 'Eisa'], ['جاسم', 'Jassim'], ['فيصل', 'Faisal'], ['حمدان', 'Hamdan'], ['منصور', 'Mansour'], ['سيف', 'Saif'], ['مروان', 'Marwan'], ['محمد', 'Mohammed'], ['أحمد', 'Ahmed'], ['عبدالله', 'Abdulla']];
  const LN = [['الكتبي', 'Al Ketbi'], ['الزعابي', 'Al Zaabi'], ['الظاهري', 'Al Dhaheri'], ['السويدي', 'Al Suwaidi'], ['الكعبي', 'Al Kaabi'], ['الشامسي', 'Al Shamsi'], ['المهيري', 'Al Muhairi'], ['المطروشي', 'Al Matrooshi'], ['الطنيجي', 'Al Tunaiji'], ['الغفلي', 'Al Ghafli'], ['المرزوقي', 'Al Marzouqi'], ['الحمادي', 'Al Hammadi']];
  const RANK = { leader: ['ملازم أول', '1st Lt.'], vice: ['مساعد أول', 'WO'], driver: ['عريف', 'Cpl.'], breacher: ['رقيب', 'Sgt.'], water: ['وكيل عريف', 'L/Cpl.'] };
  const people = []; let k = 0;
  stations.forEach(st => {
    const C = st.id === 'S4' ? { leader: 1, vice: 1, driver: 1, breacher: 2, water: 1 } : { leader: 1, vice: 1, driver: 3, breacher: 4, water: 3 };
    Object.entries(C).forEach(([r, c]) => { for (let i = 0; i < c; i++) { const f = FN[(k * 7) % FN.length], l = LN[(k * 5 + Math.floor(k / 12) * 7) % LN.length]; k++;
      people.push({ id: 'M' + k, st: st.id, role: r, ar: `${RANK[r][0]} ${f[0]} ${l[0]}`, en: `${RANK[r][1]} ${f[1]} ${l[1]}`, status: 'duty' }); } });
  });
  const leader = s => people.find(p => p.st === s && p.role === 'leader').id;
  const mkV = (cs, type, st, o) => Object.assign({ id: cs, cs, type, st, status: 'available', water: VTYPES[type].water, foam: VTYPES[type].foam, flow: 0, pumping: false, inc: null, sector: null }, o || {});
  const vehicles = [
    mkV('P-101', 'firetruck', 'S1', { status: 'onscene', inc: 'I1041', sector: 'sA', pumping: true, pumpAt: now - 4 * m, flow: 475, water: 3600 }),
    mkV('L-201', 'ladder', 'S1', { status: 'onscene', inc: 'I1041', sector: 'sA' }),
    mkV('T-401', 'tanker', 'S1', { status: 'onscene', inc: 'I1041', sector: 'sW', water: 9800 }),
    mkV('P-102', 'firetruck', 'S2', { status: 'onscene', inc: 'I1041', sector: 'sB', pumping: true, pumpAt: now - 3 * m, flow: 475, water: 3700 }),
    mkV('R-301', 'responder', 'S2', { status: 'onscene', inc: 'I1041', sector: 'sC', water: 340 }),
    mkV('T-402', 'tanker', 'S2'),
    mkV('P-103', 'firetruck', 'S3', { status: 'out' }),
    mkV('L-202', 'ladder', 'S3', { status: 'enroute', inc: 'I1042', arriveAt: now + 20000 }),
    mkV('P-106', 'firetruck', 'S3'),
    mkV('R-302', 'responder', 'S4', { status: 'onscene', inc: 'I1042', sector: 's2A' }),
    mkV('P-104', 'firetruck', 'S5'), mkV('T-403', 'tanker', 'S5'),
    mkV('P-105', 'firetruck', 'S6'), mkV('R-303', 'responder', 'S6')
  ];
  // crews in the field; entry team carries SCBA (air in litres at airAt, consumption L/min)
  const field = (st, sector, inc) => people.filter(p => p.st === st).forEach(p => { p.status = 'field'; p.sector = sector; p.inc = inc;
    if (p.role === 'breacher') { p.air = AIR_CAP * (.35 + (p.id.length % 3) * .2); p.airAt = now - 2 * m; p.rate = 55 + (+p.id.slice(1) % 4) * 6; } });
  field('S1', 'sA', 'I1041'); field('S2', 'sB', 'I1041'); field('S4', 's2A', 'I1042');
  const mis = (ar, en, s) => ({ id: uid('m'), ar, en, s });
  const i1 = {
    id: 'I1041', no: 'ح-1041', type: 'industrial', area: 'jurf', sev: 'high', status: 'onscene', created: now - 18 * m,
    ar: 'حريق مستودع · الجرف الصناعية', en: 'Warehouse fire · Al Jurf Industrial', location: 'المنطقة الصناعية الجديدة، شارع 9',
    commander: 'IC1', contain: 54, hazmat: 3, temp: 640, wind: 'NW 14', waterUsed: 9400,
    sectors: [
      { id: 'sA', key: 'A', officer: leader('S1'), status: 'crit', missions: [mis('الاقتحام الداخلي والبحث الأولي', 'Interior attack and primary search', 'doing'), mis('تهوية السقف', 'Roof ventilation', 'todo')] },
      { id: 'sB', key: 'B', officer: leader('S2'), status: 'active', missions: [mis('حماية المبنى المجاور', 'Protect the adjacent building', 'doing')] },
      { id: 'sC', key: 'C', officer: null, status: 'stable', missions: [mis('خط دفاعي عند منطقة التحميل', 'Defensive line at the loading bay', 'todo')] },
      { id: 'sW', key: 'water', officer: null, status: 'stable', missions: [mis('تشغيل الصهاريج والربط مع الحنفيات', 'Run tankers and connect hydrants', 'done')] }
    ],
    requests: [{ id: uid('q'), kind: 'tanker', from: 'IC1', at: now - 3 * m, status: 'open' }], par: null, mayday: null,
    log: [
      { t: now - 18 * m, w: 'ops', ch: 'CMD', ar: 'البلاغ ب-30871 → فتح الحادث ح-1041 وإرسال P-101 و L-201.', en: 'Call B-30871 → incident H-1041 opened, P-101 and L-201 dispatched.' },
      { t: now - 14 * m, w: leader('S1'), ch: 'TAC-1', ar: 'فريق الاقتحام من مركز الإدارة دخل القطاع أ. الأسطوانات ممتلئة.', en: 'HQ entry team inside Sector A. Cylinders full.' },
      { t: now - 12 * m, w: 'P-101', ch: 'TAC-1', ar: 'P-101 يضخ 475 لتر/دقيقة مع رغوة 3%. لهب مرئي في الطابق العلوي.', en: 'P-101 pumping 475 L/min with 3% foam. Flames visible upstairs.', k: 'warn' },
      { t: now - 9 * m, w: 'ops', ch: 'WATER', ar: 'خط الإمداد من الصهريج T-401 يعمل. ضغط مستقر 8 بار.', en: 'Supply line from tanker T-401 running. Pressure steady at 8 bar.' },
      { t: now - 7 * m, w: leader('S2'), ch: 'TAC-2', ar: 'الجهة الشرقية: خطر امتداد إلى المستودع المجاور. نطلب خطاً إضافياً.', en: 'East side: risk of spread to the next warehouse. Requesting another line.', k: 'warn' },
      { t: now - 3 * m, w: 'IC1', ch: 'CMD', ar: 'طلب صهريج مياه إضافي.', en: 'Requested an extra water tanker.' }
    ]
  };
  const i2 = {
    id: 'I1042', no: 'ح-1042', type: 'traffic', area: 'hamidiya', sev: 'med', status: 'onscene', created: now - 5 * m,
    ar: 'حادث مروري · الحميدية', en: 'Traffic collision · Al Hamidiya', location: 'شارع الشيخ محمد بن زايد، قرب جسر الحميدية',
    commander: null, contain: 20, hazmat: 0, temp: null, wind: '', waterUsed: 0,
    sectors: [{ id: 's2A', key: 'work', officer: leader('S4'), status: 'active', missions: [mis('تحرير المحتجزين', 'Free trapped people', 'doing')] }],
    requests: [], par: null, mayday: null,
    log: [{ t: now - 5 * m, w: 'ops', ch: 'CMD', ar: 'البلاغ ب-30902 → فتح الحادث ح-1042 وإرسال R-302 و L-202.', en: 'Call B-30902 → incident H-1042 opened, R-302 and L-202 dispatched.' }]
  };
  const reports = [
    { id: 'r3', no: 'ب-30911', at: now - 70000, type: 'vehicle', sev: 'high', area: 'nuaimiya', location: 'موقف بناية النعيمية 3، الطابق الأرضي', caller: 'سالم الكعبي', ar: 'سيارة تحترق في موقف البناية، الدخان يقترب من المدخل.', en: 'Car burning in the building car park; smoke reaching the entrance.', haz: ['spread', 'crowd'], trapped: false, injuries: 0, status: 'new' },
    { id: 'r4', no: 'ب-30909', at: now - 3 * m, type: 'gas', sev: 'med', area: 'rawda', location: 'مطعم على شارع الروضة 2', caller: 'مدير المطعم', ar: 'رائحة غاز قوية في المطبخ، تم إخلاء الموظفين وإغلاق الصمام الرئيسي.', en: 'Strong gas smell in the kitchen; staff evacuated and main valve shut.', haz: ['gas'], trapped: false, injuries: 0, status: 'new' }
  ];
  return { v: 2, rev: 1, seq: 1043, rseq: 30912, stations, people, vehicles, incidents: [i1, i2], reports, staff: { IC1: { ar: 'مقدم أحمد الشامسي', en: 'Lt. Col. Ahmed Al Shamsi' }, ops: { ar: 'غرفة العمليات', en: 'Operations' } } };
}

root.ICD = { T, VTYPES, TYPES, AREAS, ROLES, HAZ, SIDES, SECTORS, MISSIONS, misKind, REQ_KINDS, SUPPORT, AIR_CAP, seed };
})(typeof window !== 'undefined' ? window : this);
