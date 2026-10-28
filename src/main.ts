import './styles.css';
import { Cloud } from './cloud';
import { S } from './state';
import { installDelegation } from './ui/actions';
import { installTabs, renderAll, renderResume, renderView } from './ui/app';
import { installLiveKeys } from './ui/live';
import { wake } from './ui/wake';
// Screens register their actions when imported.
import './ui/exercises';
import './ui/history';
import './ui/picker';
import './ui/settings';
import './ui/templates';
import './ui/timer';

installDelegation();
installTabs();
installLiveKeys();

renderView();
renderResume();
if (S.active.w) void wake(true);
void Cloud.init(renderAll);
