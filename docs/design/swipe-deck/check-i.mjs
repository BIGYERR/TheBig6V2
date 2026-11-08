// No movement row on a round or block card carries the RPE i; single lift cards keep theirs.
import { readFileSync } from 'node:fs';
let rounds = 0, lifts = 0;
for (const f of ['AD_Week10Mon', 'AE_Week10Tue', 'AF_Week10Thu', 'AH_Week10Fri', 'AI_Week10Sat']) {
  const html = readFileSync((process.env.DECK_OUT || 'out') + '/project/' + f + '.dc.html', 'utf8');
  const js = html.split('data-dc-script')[1].split('>').slice(1).join('>').split('</script>')[0];
  const Cls = new Function('DCLogic', 'window', 'setTimeout', 'clearTimeout', js + '\nreturn Component;')(
    class { constructor(p) { this.props = p; } setState(s) { this.state = Object.assign({}, this.state, s); } }, { matchMedia: () => ({ matches: true }) }, (g) => { g(); return 0; }, () => {});
  const c = new Cls({}); const cards = c.data().cards;
  cards.forEach((cd, i) => {
    c.setState({ i }); const v = c.renderVals();
    if (v.c.hasMembers) { rounds++; v.c.members.forEach((m) => { if (m.hasRpe) throw new Error(f + ' card ' + i + ' ' + m.name + ' still has the i'); }); }
    if (cd.kind === 'lift' && /RPE\s*\d/.test(cd.rx)) { lifts++; if (!v.c.hasRpe) throw new Error(f + ' lift ' + cd.title + ' lost its i'); }
  });
}
console.log('multi-movement cards without the i:', rounds, '| lift cards keeping it:', lifts);
