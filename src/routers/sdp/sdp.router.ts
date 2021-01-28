import { Router } from 'express';
import { SDP_ENDPOINT } from '../../constants/endpoint';
import {
  produce,
  consume,
  processConsume,
} from '../../services/sdp/sdp.service';

export const router: Router = Router();

//{ id - current userid, producerId - requested userid, offer/answer - sdp }

router.get('/', (req, res) => {
  res.status(200).send({
    'status': 'server is running'
  });
});

router.post(SDP_ENDPOINT + '/', async (req, res) => {
  let { id, offer } = req.body;
  let answer = await produce(id, offer);
  res.status(200).send(answer);
});

router.post(SDP_ENDPOINT + '/consume', async (req, res) => {
  let { id, producerId } = req.body;
  let offer = await consume(id, producerId);
  res.status(200).send(offer);
});

router.post(SDP_ENDPOINT + '/processConsume', async (req, res) => {
  let { id, producerId, answer } = req.body;
  await processConsume(id, producerId, answer);
  res.status(200).send();
});