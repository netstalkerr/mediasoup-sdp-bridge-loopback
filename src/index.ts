import app from './server';
import config from '../config.json';
import { initialize } from './services/sdp/sdp.service';

const port = Number(process.env.PORT || config.PORT || 8080);

app.listen(port, () => {
  initialize();
});