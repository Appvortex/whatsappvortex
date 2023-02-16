import React, { useState, useEffect } from "react";
import openSocket from "../../services/socket-io";

import { makeStyles } from "@material-ui/core/styles";
import Paper from "@material-ui/core/Paper";
import Typography from "@material-ui/core/Typography";
import Container from "@material-ui/core/Container";
import Select from "@material-ui/core/Select";
import TextField from "@material-ui/core/TextField";
import { toast } from "react-toastify";
import jwt_decode from "jwt-decode";

import api from "../../services/api";
import { i18n } from "../../translate/i18n.js";
import toastError from "../../errors/toastError";
import { FormControl, InputLabel } from "@material-ui/core";

const useStyles = makeStyles(theme => ({
	root: {
		display: "flex",
		alignItems: "center",
		padding: theme.spacing(8, 8, 3),
	},

	paper: {
		padding: theme.spacing(2),
		display: "flex",
		alignItems: "center",
		marginBottom: 12,

	},

	settingOption: {
		marginLeft: "auto",
	},

	margin: {
		margin: theme.spacing(1),
	},

	maxWidth: {
		width: "100%",
	},
}));

const Settings = () => {
	const classes = useStyles();
	const [settings, setSettings] = useState([]);
	const [company, setCompany] = useState(0);
	const [queues, setQueues] = useState([]);

	useEffect(() => {
		const fetchSession = async () => {
			const token = localStorage.getItem("token");
			const userJWT = jwt_decode(token);
			setCompany(userJWT.companyId);

			try {
				const { data } = await api.get("/settings");
				setSettings(data);
			} catch (err) {
				toastError(err);
			}

			try {
				const { data } = await api.get("/queue");
				setQueues(data);
			} catch (err) {
				toastError(err);
			}
		};
		fetchSession();
	}, []);

	useEffect(() => {
		const socket = openSocket();

		socket.on("settings", data => {
			if (data.action === "update") {
				setSettings(prevState => {
					const aux = [...prevState];
					const settingIndex = aux.findIndex(s => s.key === data.setting.key);
					aux[settingIndex].value = data.setting.value;
					return aux;
				});
			}
		});

		return () => {
			socket.disconnect();
		};
	}, []);

	const handleChangeSetting = async e => {
		const selectedValue = e.target.value;
		const settingKey = e.target.name;

		try {
			await api.put(`/settings/${settingKey}`, {
				value: selectedValue,
			});
			toast.success(i18n.t("settings.success"));
		} catch (err) {
			toastError(err);
		}
	};

	const getSettingValue = key => {
		try {
			const { value } = settings.find(s => s.key === key);
			return value;
		} catch (error) {
			return ''
		}
	};

	return (
		<div className={classes.root}>
			<Container className={classes.container} maxWidth="sm">
				<Typography variant="body2" gutterBottom>
					{i18n.t("settings.title") + ` ${(company && Number(company) > 0) ? 'empresa' : 'super admin'}`}
				</Typography>

				{(company && Number(company) > 0) ?
					<Container className={classes.container} maxWidth="sm">
						< Paper className={classes.paper}>
							<FormControl variant="outlined" className={classes.maxWidth}>
								<InputLabel>{i18n.t("settings.settings.allowUserEditConnection.name")}</InputLabel>
								<Select
									native
									fullWidth
									id="allowUserEditConnection-setting"
									name="allowUserEditConnection"
									label={i18n.t("settings.settings.allowUserEditConnection.name")}
									value={settings && settings.length > 0 && getSettingValue("allowUserEditConnection")}
									className={classes.settingOption}
									onChange={handleChangeSetting}
								>
									<option value="enabled">
										{i18n.t("settings.settings.allowUserEditConnection.options.enabled")}
									</option>
									<option value="disabled">
										{i18n.t("settings.settings.allowUserEditConnection.options.disabled")}
									</option>
								</Select>
							</FormControl>
						</Paper>
						< Paper className={classes.paper}>
							<FormControl variant="outlined" className={classes.maxWidth}>
								<InputLabel>{i18n.t("settings.settings.hideTicketWithoutDepartment.name")}</InputLabel>
								<Select
									native
									fullWidth
									id="hideTicketWithoutDepartment-setting"
									name="hideTicketWithoutDepartment"
									label={i18n.t("settings.settings.hideTicketWithoutDepartment.name")}
									value={settings && settings.length > 0 && getSettingValue("hideTicketWithoutDepartment")}
									className={classes.settingOption}
									onChange={handleChangeSetting}
								>
									<option value="enabled">
										{i18n.t("settings.settings.hideTicketWithoutDepartment.options.enabled")}
									</option>
									<option value="disabled">
										{i18n.t("settings.settings.hideTicketWithoutDepartment.options.disabled")}
									</option>
								</Select>
							</FormControl>
						</Paper>
						<Paper className={classes.paper}>
							<FormControl variant="outlined" className={classes.maxWidth}>
								<InputLabel>{i18n.t("settings.settings.useBotByQueueSample.name")}</InputLabel>
								<Select
									native
									fullWidth
									id="useBotByQueueSample-setting"
									name="useBotByQueueSample"
									label={i18n.t("settings.settings.useBotByQueueSample.name")}
									value={settings && settings.length > 0 && getSettingValue("useBotByQueueSample")}
									className={classes.settingOption}
									onChange={handleChangeSetting}
								>
									<option value="enabled">
										{i18n.t("settings.settings.useBotByQueueSample.options.enabled")}
									</option>
									<option value="disabled">
										{i18n.t("settings.settings.useBotByQueueSample.options.disabled")}
									</option>
								</Select>
							</FormControl>
						</Paper>
						<Paper className={classes.paper}>
							<FormControl variant="outlined" className={classes.maxWidth}>
								<InputLabel>{i18n.t("settings.settings.tickets.autoClose.name")}</InputLabel>
								<Select
									native
									fullWidth
									className={classes.settingOption}
									id="ticketAutoClose-setting"
									name="ticketAutoClose"
									label={i18n.t("settings.settings.tickets.autoClose.name")}
									value={settings && getSettingValue("ticketAutoClose")}
									onChange={handleChangeSetting}
								>
									<option value="0">{i18n.t("settings.settings.tickets.autoClose.options.disabled")}</option>
									<option value="1">{`1 ${i18n.t("settings.settings.tickets.autoClose.options.hour")}`}</option>
									<option value="2">{`2 ${i18n.t("settings.settings.tickets.autoClose.options.hours")}`}</option>
									<option value="5">{`5 ${i18n.t("settings.settings.tickets.autoClose.options.hours")}`}</option>
									<option value="10">{`10 ${i18n.t("settings.settings.tickets.autoClose.options.hours")}`}</option>
									<option value="20">{`20 ${i18n.t("settings.settings.tickets.autoClose.options.hours")}`}</option>
									<option value="23">{`23 ${i18n.t("settings.settings.tickets.autoClose.options.hours")}`}</option>
								</Select>
							</FormControl>
						</Paper>
						<Paper className={classes.paper}>
							<FormControl variant="outlined" className={classes.maxWidth}>
								<InputLabel>{i18n.t("settings.settings.tickets.timeCreateNewTicket.name")}</InputLabel>
								<Select
									native
									fullWidth
									className={classes.settingOption}
									id="timeCreateNewTicket-setting"
									name="timeCreateNewTicket"
									label={i18n.t("settings.settings.tickets.timeCreateNewTicket.name")}
									value={settings && getSettingValue("timeCreateNewTicket")}
									onChange={handleChangeSetting}
								>
									<option value="0">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.disabled")}</option>
									<option value="10">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.10")}</option>
									<option value="30">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.30")}</option>
									<option value="60">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.60")}</option>
									<option value="300">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.300")}</option>
									<option value="1800">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.1800")}</option>
									<option value="3600">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.3600")}</option>
									<option value="7200">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.7200")}</option>
									<option value="21600">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.21600")}</option>
									<option value="43200">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.43200")}</option>
									<option value="86400">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.86400")}</option>
									<option value="604800">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.604800")}</option>
									<option value="1296000">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.1296000")}</option>
									<option value="2592000">{i18n.t("settings.settings.tickets.timeCreateNewTicket.options.2592000")}</option>
								</Select>
							</FormControl>
						</Paper>
						<Paper className={classes.paper}>
							<FormControl variant="outlined" className={classes.maxWidth}>
								<InputLabel>{i18n.t("settings.settings.tickets.transfer.afterMinutes")}</InputLabel>
								<Select
									native
									fullWidth
									className={classes.settingOption}
									id="afterMinutesToTransfer-setting"
									name="afterMinutesToTransfer"
									label={i18n.t("settings.settings.tickets.transfer.afterMinutes")}
									value={settings && getSettingValue("afterMinutesToTransfer")}
									onChange={handleChangeSetting}
								>
									<option value="0">{i18n.t("settings.settings.tickets.transfer.options.disabled")}</option>
									<option value="10">{i18n.t("settings.settings.tickets.transfer.options.10")}</option>
									<option value="30">{i18n.t("settings.settings.tickets.transfer.options.30")}</option>
									<option value="60">{i18n.t("settings.settings.tickets.transfer.options.60")}</option>
									<option value="300">{i18n.t("settings.settings.tickets.transfer.options.300")}</option>
									<option value="600">{i18n.t("settings.settings.tickets.transfer.options.600")}</option>
									<option value="900">{i18n.t("settings.settings.tickets.transfer.options.900")}</option>
									<option value="1200">{i18n.t("settings.settings.tickets.transfer.options.1200")}</option>
									<option value="1800">{i18n.t("settings.settings.tickets.transfer.options.1800")}</option>
								</Select>
							</FormControl>
						</Paper>
						<Paper className={classes.paper}>
							<FormControl variant="outlined" className={classes.maxWidth}>
								<InputLabel>{i18n.t("settings.settings.tickets.transfer.autoTransfer")}</InputLabel>
								<Select
									native
									fullWidth
									className={classes.settingOption}
									id="afterMinutesTicketWithoutDepartmentTransferTo-setting"
									name="afterMinutesTicketWithoutDepartmentTransferTo"
									label={i18n.t("settings.settings.tickets.transfer.autoTransfer")}
									value={settings && getSettingValue("afterMinutesTicketWithoutDepartmentTransferTo")}
									onChange={handleChangeSetting}
								>
									{queues.map((queue) => (
										<option key={queue.id} value={queue.id}>{queue.name}</option>
									))}
								</Select>
							</FormControl>
						</Paper>
						{(getSettingValue("showApiKeyInCompanies") === "enabled") ?
							<Paper className={classes.paper}>
								<FormControl variant="outlined" className={classes.maxWidth}>
									<TextField
										native
										multiline
										rows={5}
										fullWidth
										readonly
										id="api-token-setting"
										margin="dense"
										variant="outlined"
										label={i18n.t("settings.settings.apiKey.name")}
										value={settings && settings.length > 0 && getSettingValue(`userApiToken`)}
									/>
								</FormControl>
							</Paper>
							: null}

					</Container> :

					<Container className={classes.container} maxWidth="sm">
						<Paper className={classes.paper}>
							<FormControl variant="outlined" className={classes.maxWidth}>
								<InputLabel>{i18n.t("settings.settings.userCreation.name")}</InputLabel>
								<Select
									native
									fullWidth
									className={classes.settingOption}
									id="userCreation-setting"
									name="userCreation"
									label={i18n.t("settings.settings.userCreation.name")}
									value={settings && settings.length > 0 && getSettingValue("userCreation")}
									onChange={handleChangeSetting}
								>
									<option value="enabled">
										{i18n.t("settings.settings.userCreation.options.enabled")}
									</option>
									<option value="disabled">
										{i18n.t("settings.settings.userCreation.options.disabled")}
									</option>
								</Select>
							</FormControl>
						</Paper>
						<Paper className={classes.paper}>
							<FormControl variant="outlined" className={classes.maxWidth}>
								<InputLabel>{i18n.t("settings.settings.showApiKeyInCompanies.name")}</InputLabel>
								<Select
									native
									fullWidth
									className={classes.settingOption}
									id="showApiKeyInCompanies-setting"
									name="showApiKeyInCompanies"
									label={i18n.t("settings.settings.showApiKeyInCompanies.name")}
									value={settings && settings.length > 0 && getSettingValue("showApiKeyInCompanies")}
									onChange={handleChangeSetting}
								>
									<option value="enabled">
										{i18n.t("settings.settings.showApiKeyInCompanies.options.enabled")}
									</option>
									<option value="disabled">
										{i18n.t("settings.settings.showApiKeyInCompanies.options.disabled")}
									</option>
								</Select>
							</FormControl>
						</Paper>
					</Container>
				}

			</Container>
		</div >
	);
};

export default Settings;
