import React, { useState, useEffect, useContext } from "react";
import { useHistory } from "react-router-dom";

import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";

import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogTitle from "@material-ui/core/DialogTitle";

import { i18n } from "../../translate/i18n";
import api from "../../services/api";
import ButtonWithSpinner from "../ButtonWithSpinner";
import toastError from "../../errors/toastError";
import { AuthContext } from "../../context/Auth/AuthContext";
import { parseISO, format } from "date-fns";

import {
    FormControl,
    InputLabel,
    makeStyles,
    Select
} from "@material-ui/core";

const useStyles = makeStyles((theme) => ({
    maxWidth: {
        width: "100%",
    },
}));

const NewTicketModalSingle = ({ selectedContact, modalOpen, onClose }) => {
    const history = useHistory(); 
    const [loading, setLoading] = useState(false); 
    const { user } = useContext(AuthContext);
    const [selectedQueue, setSelectedQueue] = useState('');
    const [queues, setQueues] = useState([]); 
    const classes = useStyles();

    useEffect(() => {
        const loadQueues = async () => {
          let listAll = user.queues; 
          const date = new Date().toISOString();
          let list = [];
    
          listAll.forEach(temp => {
            if (temp.startWork && temp.startWork !== '') {
              if (format(parseISO(date), "HH:mm") >= temp.startWork && format(parseISO(date), "HH:mm") <= temp.endWork)
                list.push(temp);
            } else {
              list.push(temp);
            }
          }); 

          setQueues(list);
        }

        loadQueues();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, []);
    
    const handleClose = () => {
		onClose(); 
		selectedContact = '';
    };

    const handleSaveTicket = async contactId => {
        if (!contactId || !selectedQueue)
            return;

        setLoading(true);
        try {
            const { data: ticket } = await api.post("/tickets", {
                contactId: contactId,
                userId: user.id,
                status: "open",
                queueId: selectedQueue
            });
            history.push(`/tickets/${ticket.id}`);
        } catch (err) {
            toastError(err);
        }
        setLoading(false);
        handleClose();
    };

    return (
        <>
            <Dialog open={modalOpen} onClose={handleClose}>
                <DialogTitle id="form-dialog-title">
                    {i18n.t("newTicketModal.title")}
                </DialogTitle>
                <DialogContent dividers>
                    <FormControl variant="outlined" className={classes.maxWidth}>
                        <InputLabel>{i18n.t("newTicketModal.fieldQueue")}</InputLabel>
                        <Select 
                            required
                            native
                            fullWidth
                            className={classes.settingOption}
                            value={selectedQueue} 
                            onChange={(e) => setSelectedQueue(e.target.value)}
                            label={i18n.t("newTicketModal.fieldQueue")}
                        >
                            <option value={''}>&nbsp;</option>	
                            {queues.map((queue) => (
                                <option key={queue.id} value={queue.id}>{queue.name}</option>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button
                        onClick={handleClose}
                        color="secondary"
                        disabled={loading}
                        variant="outlined"
                    >
                        {i18n.t("newTicketModal.buttons.cancel")}
                    </Button>
                    <ButtonWithSpinner
                        variant="contained"
                        type="button"
                        disabled={!selectedContact || !selectedQueue || queues.length === 0}
                        onClick={() => handleSaveTicket(selectedContact)}
                        color="primary"
                        loading={loading}
                    >
                        {i18n.t("newTicketModal.buttons.ok")}
                    </ButtonWithSpinner>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default NewTicketModalSingle;
