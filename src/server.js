import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as dateMath from 'date-arithmetic';
import apiRouter from './router';
import { mailer, scheduler } from './services';
import * as constants from './constants';
import { tokenForUser } from './controllers/user-controller';
import Trip from './models/trip-model';
import routers from './routers';

process.env.TZ = 'America/New_York';

const mongoURI = process.env.MONGODB_URI;

mongoose.set('useCreateIndex', true);

mongoose.connect(mongoURI, { useNewUrlParser: true })
  .then((connection) => {
    return console.log(`MongoDB connection established at ${connection.connections[0].host}:${connection.connections[0].port}`);
  }).catch((error) => {
    console.log(`Error connecting to MongoDB: ${error.message}`);
    mongoose.connect('mongodb://localhost/trailhead', { useNewUrlParser: true }).then((connection) => {
      return console.log(`MongoDB connection established at ${connection.connections[0].host}:${connection.connections[0].port}`);
    });
  });

// set mongoose promises to es6 default
mongoose.Promise = global.Promise;

dotenv.config({ silent: true });

const app = express();

app.use(cors());

// enable/disable http request logging
app.use(morgan('dev'));

// enable only if you want templating
app.set('view engine', 'ejs');

// enable only if you want static assets from folder static
app.use(express.static('static'));

// this just allows us to render ejs from the ../app/views directory
app.set('views', path.join(__dirname, '../src/views'));

// enable json message body for posting data to API
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


app.use('/', (req, res, next) => { next(); }, apiRouter);
app.use('/trips', routers.trips);

// START THE SERVER
// =============================================================================
const port = process.env.PORT || 9090;
app.listen(port);
console.log(`listening on: ${port}`);

/**
 * Sends check-out link for trips upon leaving to leaders.
 */
const sendCheckOutEmail = () => {
  const today = new Date();
  Trip.find({}).populate('leaders').then((trips) => {
    trips.forEach((trip) => {
      if ((today < trip.startDate) && (trip.startDateAndTime.getTime() - today.getTime() <= (1 * 3600000)) && (trip.startDateAndTime.getTime() - today.getTime() >= (24 * 3600000)) && !trip.sentEmails.includes('CHECK_OUT')) {
        console.log('[Mailer] Sending trip check-out email to leaders');
        const leaderEmails = trip.leaders.map((leader) => { return leader.email; });
        mailer.send({ address: leaderEmails, subject: `Trip #${trip.number} is happening soon`, message: `Hello,\n\nYour Trip #${trip.number}: ${trip.title} is happening in 48 hours!\n\nHere is a mobile-friendly 📱 URL (open it on your phone) for you to mark all attendees before you leave ${trip.pickup}: ${constants.frontendURL}/trip-check-out/${trip._id}?token=${tokenForUser(trip.leaders[0], 'mobile', trip._id)}\n\nView the trip here: ${constants.frontendURL}/trip/${trip._id}\n\nBest,\nDOC Trailhead Platform\n\nThis email was generated with 💚 by the Trailhead-bot 🤖, but it cannot respond to your replies.` });
        trip.sentEmails = [...trip.sentEmails, 'CHECK_OUT'];
        trip.save();
      }
    });
  });
};

/**
 * Sends check-in link for trips on their return to leaders.
 */
const sendCheckInEmail = () => {
  const today = new Date();
  Trip.find({}).populate('leaders').then((trips) => {
    trips.forEach((trip) => {
      if ((today < trip.endDate) && (trip.endDateAndTime.getTime() - today.getTime() <= (1 * 3600000)) && !trip.sentEmails.includes('CHECK_IN')) {
        console.log('[Mailer] Sending trip check-in email to leaders');
        const leaderEmails = trip.leaders.map((leader) => { return leader.email; });
        mailer.send({ address: leaderEmails, subject: `Trip #${trip.number} should be returning soon`, message: `Hello,\n\nYour Trip #${trip.number}: ${trip.title} should return within 2 hours.\n\nHere is a mobile-friendly 📱 URL (open it on your phone) for you to mark a successful return and check-in all trippees when you arrive at ${trip.dropoff}: ${constants.frontendURL}/trip-check-in/${trip._id}?token=${tokenForUser(trip.leaders[0], 'mobile', trip._id)}\n\nIf an EMERGENCY occured, please get emergency help right away, and follow the link above to mark your status so OPO staff is informed.\n\nBest,\nDOC Trailhead Platform\n\nThis email was generated with 💚 by the Trailhead-bot 🤖, but it cannot respond to your replies.` });
        trip.sentEmails = [...trip.sentEmails, 'CHECK_IN'];
        trip.save();
      }
    });
  });
};

/**
 * If a trip fails to return within 90 minutes of its designated return time, leaders are emailed with a warning.
 */
const send90MinuteLateEmail = () => {
  const today = new Date();
  Trip.find({}).populate('leaders').then((trips) => {
    trips.forEach((trip) => {
      if ((!trip.returned) && (today > trip.endDateAndTime) && (today.getTime() - trip.endDateAndTime.getTime() < (3 * 3600000)) && (today.getTime() - trip.endDateAndTime.getTime() > (1.5 * 3600000)) && !trip.sentEmails.includes('LATE_90')) {
        console.log('[Mailer] Sending 90 minute fail-to-return email to leaders');
        const leaderEmails = trip.leaders.map((leader) => { return leader.email; });
        mailer.send({ address: leaderEmails, subject: `Trip #${trip.number} late for return`, message: `Hello,\n\nYour [Trip #${trip.number}: ${trip.title}] is now 90 minutes late. It was scheduled to return at ${constants.formatDateAndTime(trip.endDateAndTime, 'SHORT')}. OPO will be notified in the next 90 minutes if your trip is not back in Hanover. If you are having difficulties getting back, please follow the DOC Emergency Protocols found here:\n\nhttps://docs.google.com/forms/u/1/d/e/1FAIpQLSeo9jIcTGNstZ1uADtovDjJT8kkPtS-YpRwzJC2MZkVkbH0hw/viewform.\n\nIMPORTANT: right after you return, you must check-in all attendees here: ${constants.frontendURL}/trip-check-in/${trip._id}?token=${tokenForUser(trip.leaders[0], 'mobile', trip._id)}\n\nBest,\nDOC Trailhead Platform\n\nThis email was generated with 💚 by the Trailhead-bot 🤖, but it cannot respond to your replies.` })
          .then(() => {
            trip.sentEmails = [...trip.sentEmails, 'LATE_90'];
            trip.save();
          }).catch((error) => { return console.log(error); });
      }
    });
  });
};

/**
 * If a trip has not returned within 3 hours of its designated return time, OPO is alerted.
 */
const send3HourLateEmail = () => {
  const today = new Date();
  Trip.find({}).populate('leaders').then((trips) => {
    trips.forEach((trip) => {
      if ((!trip.returned) && (today > trip.endDateAndTime) && (today.getTime() - trip.endDateAndTime.getTime() > (3 * 3600000)) && !trip.sentEmails.includes('LATE_180')) {
        console.log('[Mailer] Sending 3 hour fail-to-return notice leaders and OPO staff');
        const leaderEmails = trip.leaders.map((leader) => { return leader.email; });
        Promise.all([
          mailer.send({ address: leaderEmails, subject: `Trip #${trip.number} not returned`, message: `Hello,\n\nYour [Trip #${trip.number}: ${trip.title}], was due back at ${constants.formatDateAndTime(trip.endDateAndTime, 'SHORT')} and has not yet checked back in from Hanover. We have informed OPO staff about your status. Trip details can be found at:\n\n${constants.frontendURL}/trip/${trip._id}\n\nBest,\nDOC Trailhead Platform\n\nThis email was generated with 💚 by the Trailhead-bot 🤖, but it cannot respond to your replies.` }),
          mailer.send({ address: constants.OPOEmails, subject: `Trip #${trip.number} not returned`, message: `Hello,\n\n[Trip #${trip.number}: ${trip.title}], was due back at ${constants.formatDateAndTime(trip.endDateAndTime, 'SHORT')} and has not yet checked back in from Hanover. Trip details can be found at:\n\n${constants.frontendURL}/trip/${trip._id}\n\nBest,\nDOC Trailhead Platform\n\nThis email was generated with 💚 by the Trailhead-bot 🤖, but it cannot respond to your replies.` }),
        ]).then(() => {
          trip.sentEmails = [...trip.sentEmails, 'LATE_180'];
          trip.save();
        }).catch((error) => {
          console.log(error);
        });
      }
    });
  });
};

const markTripsAsPast = () => {
  const now = new Date();
  const yesterday = dateMath.subtract(now, 1, 'day');
  Trip.find({ past: false }).sort({ startDateAndTime: 'ascending' }).then((trips) => {
    trips.forEach((trip) => {
      if (trip.startDateAndTime < yesterday) {
        trip.past = true;
        trip.save();
      }
    });
  });
};

/**
 * Schedules time-based emails.
 */
if (process.env.NODE_ENV !== 'development') {
  console.log('Scheduling');
  scheduler.schedule(markTripsAsPast, 'daily');
  scheduler.schedule(sendCheckInEmail, 'minutely');
  scheduler.schedule(sendCheckOutEmail, 'minutely');
  scheduler.schedule(send90MinuteLateEmail, 'minutely');
  scheduler.schedule(send3HourLateEmail, 'minutely');
}
