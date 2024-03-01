/* eslint-disable */
'use strict';
const { Model, Op } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class session extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      session.belongsTo(models.UserAccount, {
        foreignKey: 'userId',
      })
    }
    // method to create sessions
    static addSession({ date, place, playerName, totalPlayers, sport, userId }) {
      return this.create({
        date: date,
        place: place,
        playerName: playerName,
        totalPlayers: totalPlayers,
        sport: sport,
        userId: userId,
        active: true,
        Reason: null
      })
    }

    // method to get all sessions with date not null
    static getEverySessions() {
      return this.findAll()
    }
    // method to get as session by its sport name
    static getSessionsBySport(sport) {
      return this.findAll({
        where: {
          sport: sport
        }
      })
    }

    // method to get a session by its id
    static getSessionById(id) {
      return this.findOne({
        where: {
          id: id
        }
      })
    }

    // method to delete sessions by its sport
    static deleteSessionsBySport(sport) {
      return this.destroy({
        where: {
          sport: sport
        }
      })
    }

    // method to delete sessions by its id
    static deleteSessionById(id) {
      return this.destroy({
        where: {
          id: id
        }
      })
    }


    // method to update sessions by its id
    static updateSessionById(id, { date, place, playerName, totalPlayers, sport }) {
      return this.update({
        date: date,
        place: place,
        playerName: playerName,
        totalPlayers: totalPlayers,
        sport: sport,
      }, {
        where: {
          id: id
        }
      })
    }

    // update only the name of the player
    static updatePlayerNameById(id, playerName) {
      return this.update({
        playerName: playerName
      }, {
        where: {
          id: id
        }
      })
    }

    // extract active sessions
    static getActiveSessions(sport) {
      return this.findAll({
        where: {
          date: {
            [Op.gt]: new Date(), // after today
          },
          sport: sport,
          active: true
        }
      })
    }

    // extract past sessions
    static getPastSessions(sport) {
      return this.findAll({
        where: {
          date: {
            [Op.lt]: new Date(), // before today
          },
          sport: sport,
          active: true
        }
      })
    }

    // method to extract the sessions of a user
    static getSessionsByUserId(userId, sport) {
      return this.findAll({
        where: {
          userId: userId,
          sport: sport,
          active: true

        }
      })
    }

    // method to cancel a session by giving active value and reason
    static cancelSessionById(id, Reason) {
      return this.update({
        active: false,
        Reason: Reason
      }, {
        where: {
          id: id
        }
      })
    }

    // display sessions with active status false
    static getInactiveSessions(sport) {
      return this.findAll({
        where: {
          active: false,
          sport: sport
        }
      })
    }

    // method to find number of active sessions
    static getNumberOfActiveSessions() {
      return this.findAll({
        where: {
          active: true
        }
      })
    }

    // method to find number of inactive sessions
    static getNumberOfInactiveSessions() {
      return this.findAll({
        where: {
          active: false
        }
      })
    }


    // get passes sessions
    static getPassedSessions() {
      return this.findAll({
        where: {
          date: {
            [Op.lt]: new Date(), // before today
          },
          active: true
        }
      })
    }

    // get future sessions
    static getFutureSessions() {
      return this.findAll({
        where: {
          date: {
            [Op.gt]: new Date(), // after today
          },
          active: true
        }
      })
    }
    // fetch today's sessions
    static getTodaySessions() {
      return this.findAll({
        where: {
          date: { [Op.eq]: new Date(), },
          active: true
        }
      }
      )
    }

    // get available sessions
    static getAvailableSessions() {
      return this.findAll({
        where: {
          date: {
            // not null 
            [Op.ne]: null
          }
        }
      })

    }
  }
  session.init({
    date: DataTypes.DATEONLY,
    place: DataTypes.STRING,
    playerName: DataTypes.STRING,
    totalPlayers: DataTypes.INTEGER,
    sport: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    active: DataTypes.BOOLEAN,
    Reason: DataTypes.STRING

  }, {
    sequelize,
    modelName: 'Sessions',
  });
  return session;
};