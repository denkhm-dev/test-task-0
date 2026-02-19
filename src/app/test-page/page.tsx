'use client';
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box, Button, TextField, MenuItem, Typography, Paper, Grid,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  InputAdornment, Stack, Tabs, Tab, Tooltip, Fade, alpha
} from '@mui/material';
import {
  Delete, CheckCircle, Edit, Search, Add, DeleteSweep,
  NoteAdd, CloudDone, Sync, Close
} from '@mui/icons-material';
import dayjs from 'dayjs';

import { RootState } from '@/shared/store';
import {
  createDraft,
  setActiveDraft,
  updateDraft,
  stopSaving,
  deleteDraft,
  clearAllDrafts,
  addLog,
  updateLog,
  deleteLog,
  updateCurrentForm,
  ServiceLog,
  Draft,
} from '@/shared/store/service-logs-slice';
import { serviceLogSchema } from '@/shared/schema/schema';

// ─── Типи для форми ────────────────────────────────────
type FormValues = {
  providerId: string;
  serviceOrder: string;
  carId: string;
  odometer: number;
  engineHours: number;
  startDate: string;
  endDate: string;
  type: 'planned' | 'unplanned' | 'emergency';
  serviceDescription: string;
};

// ─── Кольори для типів ─────────────────────────────────
const typeConfig = {
  planned:   { label: 'Planned',   color: '#2e7d32', bg: '#e8f5e9' },
  unplanned: { label: 'Unplanned', color: '#ed6c02', bg: '#fff3e0' },
  emergency: { label: 'Emergency', color: '#d32f2f', bg: '#ffebee' },
} as const;

// ─── CSS-in-JS стилі ───────────────────────────────────
const sx = {
  page: {
    p: { xs: 2, md: 4 },
    maxWidth: 1400,
    mx: 'auto',
  },
  header: {
    mb: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 2,
  },
  title: {
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: '#1a237e',
    fontSize: { xs: '1.5rem', md: '2rem' },
  },
  formCard: {
    p: 3,
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    position: 'relative',
    transition: 'box-shadow 0.2s',
    '&:hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  },
  savingBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: 0.5,
    px: 1.5,
    py: 0.5,
    borderRadius: 2,
    fontSize: '0.75rem',
    fontWeight: 600,
  },
  table: {
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
    overflow: 'hidden',
  },
  tableHead: {
    bgcolor: '#f0f4ff',
    '& .MuiTableCell-head': {
      fontWeight: 700,
      color: '#1a237e',
      fontSize: '0.8rem',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    },
  },
  filterBar: {
    p: 2,
    mb: 2,
    borderRadius: 3,
    border: '1px solid',
    borderColor: 'divider',
  },
  draftTab: {
    textTransform: 'none' as const,
    fontWeight: 600,
    minHeight: 36,
    fontSize: '0.8rem',
  },
};

// ═══════════════════════════════════════════════════════
// ГОЛОВНИЙ КОМПОНЕНТ
// ═══════════════════════════════════════════════════════
export default function ServiceLogsPage() {
  const dispatch = useDispatch();
  const { logs, drafts = [], activeDraftId = null, currentForm = {}, isSaving } = useSelector(
    (state: RootState) => state.serviceLogs
  );

  const activeDraft = useMemo(
    () => drafts.find(d => d.id === activeDraftId),
    [drafts, activeDraftId]
  );


  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });


  const [selectedLog, setSelectedLog] = useState<ServiceLog | null>(null);
  const [logToDelete, setLogToDelete] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const defaultValues: FormValues = useMemo(() => ({
    providerId: '',
    serviceOrder: '',
    carId: '',
    odometer: 0,
    engineHours: 0,
    startDate: dayjs().format('YYYY-MM-DD'),
    endDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    type: 'planned' as const,
    serviceDescription: '',
  }), []);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: yupResolver(serviceLogSchema) as any,
    defaultValues: activeDraft 
      ? { ...defaultValues, ...activeDraft.data } 
      : { ...defaultValues, ...currentForm },
  });

  // Форма для редагування
  const editForm = useForm<FormValues>({
    resolver: yupResolver(serviceLogSchema) as any,
  });

  const watchedValues = watch();


  useEffect(() => {
    const activeDraft = drafts.find(d => d.id === activeDraftId);
    const dataToReset = activeDraft ? { ...activeDraft.data } : { ...currentForm };


    if (!dataToReset.startDate) dataToReset.startDate = defaultValues.startDate;
    if (!dataToReset.endDate) dataToReset.endDate = defaultValues.endDate;

    reset({ ...defaultValues, ...dataToReset });

  }, [activeDraftId, reset]); 

  useEffect(() => {
    const sub = watch((value) => {
      if (activeDraftId) {
        dispatch(updateDraft(value));
      } else {
        dispatch(updateCurrentForm(value));
      }
      const t = setTimeout(() => dispatch(stopSaving()), 800);
      return () => clearTimeout(t);
    });
    return () => sub.unsubscribe();
  }, [watch, dispatch, activeDraftId]);


  useEffect(() => {
    if (watchedValues.startDate) {
      const start = dayjs(watchedValues.startDate);
      const currentEnd = dayjs(watchedValues.endDate);

      if (!watchedValues.endDate || !currentEnd.isAfter(start)) {
        setValue('endDate', start.add(1, 'day').format('YYYY-MM-DD'));
      }
    }
  }, [watchedValues.startDate, setValue, watchedValues.endDate]);


  const editStartDate = editForm.watch('startDate');
  const editEndDate = editForm.watch('endDate');
  useEffect(() => {
    if (editStartDate) {
      const start = dayjs(editStartDate);
      const currentEnd = dayjs(editEndDate);
      if (!editEndDate || !currentEnd.isAfter(start)) {
        editForm.setValue('endDate', start.add(1, 'day').format('YYYY-MM-DD'));
      }
    }
  }, [editStartDate, editForm, editEndDate]);

  useEffect(() => {
    if (dateRange.start && dateRange.end) {
      const start = dayjs(dateRange.start);
      const end = dayjs(dateRange.end);
      if (!end.isAfter(start)) {
        setDateRange(p => ({ ...p, end: start.add(1, 'day').format('YYYY-MM-DD') }));
      }
    }
  }, [dateRange.start, dateRange.end]);


  const handleCreateDraft = useCallback(() => {
    dispatch(createDraft({
      startDate: dayjs().format('YYYY-MM-DD'),
      endDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
      type: 'planned',
    }));

  }, [dispatch]);

  const handleDeleteDraft = useCallback(() => {
    dispatch(deleteDraft());
    reset(defaultValues);
  }, [dispatch, reset, defaultValues]);

  const handleClearAllDrafts = useCallback(() => {
    dispatch(clearAllDrafts());
    reset(defaultValues);
  }, [dispatch, reset, defaultValues]);

  const onSubmit = useCallback((data: FormValues) => {
    dispatch(addLog(data));
    dispatch(updateCurrentForm({}));
    reset(defaultValues);
  }, [dispatch, reset, defaultValues]);


  const filteredLogs = useMemo(() => {
    return logs.filter(log => {

      const q = search.toLowerCase();
      const matchesSearch = !q ||
        log.providerId.toLowerCase().includes(q) ||
        log.serviceOrder.toLowerCase().includes(q) ||
        log.carId.toLowerCase().includes(q) ||
        log.serviceDescription.toLowerCase().includes(q) ||
        log.type.toLowerCase().includes(q);

      const matchesType = filterType === 'all' || log.type === filterType;

      let matchesDate = true;
      if (dateRange.start) {
        matchesDate = dayjs(log.startDate).isAfter(dayjs(dateRange.start).subtract(1, 'day'));
      }
      if (matchesDate && dateRange.end) {
        matchesDate = dayjs(log.startDate).isBefore(dayjs(dateRange.end).add(1, 'day'));
      }

      return matchesSearch && matchesType && matchesDate;
    });
  }, [logs, search, filterType, dateRange]);


  return (
    <Box sx={sx.page}>

      <Box sx={sx.header}>
        <NoteAdd sx={{ fontSize: 36, color: '#004aad' }} />
        <Box>
          <Typography sx={sx.title}>MediDrive — Service Logs</Typography>
          <Typography variant="body2" color="text.secondary">
            Create, manage and track vehicle service records
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>

        <Grid size={{ xs: 12, md: 5, lg: 4 }}>
          <Paper sx={sx.formCard}>
            {/* ── Статус збереження ── */}
            <Box sx={{ position: 'absolute', top: 12, right: 12 }}>
              {activeDraftId && (
                <Fade in>
                  <Box sx={{
                    ...sx.savingBadge,
                    bgcolor: isSaving ? '#fff3e0' : '#e8f5e9',
                    color: isSaving ? '#ed6c02' : '#2e7d32',
                  }}>
                    {isSaving
                      ? <><Sync sx={{ fontSize: 16, animation: 'spin 1s linear infinite', '@keyframes spin': { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } } }} /> Saving...</>
                      : <><CloudDone sx={{ fontSize: 16 }} /> Draft saved</>
                    }
                  </Box>
                </Fade>
              )}
            </Box>

            <Typography variant="h6" fontWeight={700} mb={2}>
              {activeDraftId ? 'Edit Draft' : 'New Service Log'}
            </Typography>

            {/* ── Таби чернеток ── */}
            {drafts.length > 0 && (
              <Box sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                  value={activeDraftId || false}
                  onChange={(_, v) => dispatch(setActiveDraft(v))}
                  variant="scrollable"
                  scrollButtons="auto"
                  sx={{ minHeight: 36 }}
                >
                  {drafts.map((draft, i) => (
                    <Tab
                      key={draft.id}
                      value={draft.id}
                      sx={sx.draftTab}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {draft.isSaved && (
                            <CheckCircle sx={{ fontSize: 14, color: '#2e7d32' }} />
                          )}
                          {draft.data.carId || draft.data.providerId || `Draft ${i + 1}`}
                        </Box>
                      }
                    />
                  ))}
                </Tabs>
              </Box>
            )}

            {/* ── Форма ── */}
            <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
              <Stack spacing={2}>
                <TextField
                  {...register('providerId')}
                  label="Provider ID"
                  size="small"
                  fullWidth
                  error={!!errors.providerId}
                  helperText={errors.providerId?.message}
                />
                <TextField
                  {...register('serviceOrder')}
                  label="Service Order"
                  size="small"
                  fullWidth
                  error={!!errors.serviceOrder}
                  helperText={errors.serviceOrder?.message}
                />
                <TextField
                  {...register('carId')}
                  label="Car ID"
                  size="small"
                  fullWidth
                  error={!!errors.carId}
                  helperText={errors.carId?.message}
                />
                <TextField
                  {...register('type')}
                  select
                  label="Type"
                  size="small"
                  fullWidth
                  defaultValue="planned"
                  error={!!errors.type}
                  helperText={errors.type?.message}
                >
                  <MenuItem value="planned">🟢 Planned</MenuItem>
                  <MenuItem value="unplanned">🟠 Unplanned</MenuItem>
                  <MenuItem value="emergency">🔴 Emergency</MenuItem>
                </TextField>

                <Stack direction="row" spacing={1}>
                  <TextField
                    {...register('odometer')}
                    label="Odometer (mi)"
                    type="number"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { min: 0 } }}
                    error={!!errors.odometer}
                    helperText={errors.odometer?.message}
                  />
                  <TextField
                    {...register('engineHours')}
                    label="Engine Hours"
                    type="number"
                    size="small"
                    fullWidth
                    slotProps={{ htmlInput: { min: 0 } }}
                    error={!!errors.engineHours}
                    helperText={errors.engineHours?.message}
                  />
                </Stack>

                <Stack direction="row" spacing={1}>
                  <TextField
                    {...register('startDate')}
                    type="date"
                    label="Start Date"
                    fullWidth
                    size="small"
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={!!errors.startDate}
                  />
                  <TextField
                    {...register('endDate')}
                    type="date"
                    label="End Date"
                    fullWidth
                    size="small"
                    slotProps={{ 
                      inputLabel: { shrink: true },
                      htmlInput: { min: watchedValues.startDate ? dayjs(watchedValues.startDate).add(1, 'day').format('YYYY-MM-DD') : undefined }
                    }}
                    error={!!errors.endDate}
                  />
                </Stack>

                <TextField
                  {...register('serviceDescription')}
                  label="Service Description"
                  multiline
                  rows={3}
                  fullWidth
                  error={!!errors.serviceDescription}
                  helperText={errors.serviceDescription?.message}
                />

                {/* ── Кнопки ── */}
                <Stack spacing={1} sx={{ pt: 1 }}>
                  <Button
                    variant="contained"
                    type="submit"
                    size="large"
                    sx={{
                      fontWeight: 700,
                      borderRadius: 2,
                      bgcolor: '#004aad',
                      '&:hover': { bgcolor: '#003380' },
                    }}
                  >
                    Create Service Log
                  </Button>

                  <Button
                    variant="outlined"
                    startIcon={<Add />}
                    onClick={handleCreateDraft}
                    sx={{
                      borderRadius: 2,
                      fontWeight: 600,
                      borderColor: '#004aad',
                      color: '#004aad',
                    }}
                  >
                    Create Draft
                  </Button>

                  <Stack direction="row" spacing={1}>
                    <Button
                      variant="outlined"
                      color="warning"
                      fullWidth
                      startIcon={<Delete />}
                      onClick={handleDeleteDraft}
                      disabled={!activeDraftId}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                      Delete Draft
                    </Button>
                    <Button
                      variant="outlined"
                      color="error"
                      fullWidth
                      startIcon={<DeleteSweep />}
                      onClick={() => setShowClearConfirm(true)}
                      disabled={drafts.length === 0}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                      Clear All Drafts
                    </Button>
                  </Stack>
                </Stack>
              </Stack>
            </Box>
          </Paper>
        </Grid>


        <Grid size={{ xs: 12, md: 7, lg: 8 }}>
          {/* ── Фільтри ── */}
          <Paper sx={sx.filterBar}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search all fields..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Search sx={{ color: '#004aad' }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 2.5 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Type"
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                >
                  <MenuItem value="all">All Types</MenuItem>
                  <MenuItem value="planned">Planned</MenuItem>
                  <MenuItem value="unplanned">Unplanned</MenuItem>
                  <MenuItem value="emergency">Emergency</MenuItem>
                </TextField>
              </Grid>
              <Grid size={{ xs: 6, sm: 2.5 }}>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  label="From"
                  value={dateRange.start}
                  slotProps={{ inputLabel: { shrink: true } }}
                  onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))}
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 2.5 }}>
                <TextField
                  type="date"
                  size="small"
                  fullWidth
                  label="To"
                  value={dateRange.end}
                  slotProps={{ 
                    inputLabel: { shrink: true },
                    htmlInput: { min: dateRange.start ? dayjs(dateRange.start).add(1, 'day').format('YYYY-MM-DD') : undefined }
                  }}
                  onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* ── Таблиця ── */}
          <TableContainer component={Paper} sx={sx.table}>
            <Table size="small">
              <TableHead sx={sx.tableHead}>
                <TableRow>
                  <TableCell>Provider / Order</TableCell>
                  <TableCell>Car ID</TableCell>
                  <TableCell align="right">Odometer</TableCell>
                  <TableCell align="right">Engine Hrs</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredLogs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      {logs.length === 0
                        ? 'No service logs yet. Create one using the form.'
                        : 'No results match your filters.'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLogs.map((log) => (
                    <TableRow
                      key={log.id}
                      sx={{
                        transition: 'background 0.15s',
                        '&:hover': { bgcolor: '#f0f4ff' },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{log.providerId}</Typography>
                        <Typography variant="caption" color="text.secondary">#{log.serviceOrder}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>{log.carId}</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{Number(log.odometer).toLocaleString()} mi</Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2">{Number(log.engineHours).toLocaleString()}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={typeConfig[log.type].label}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            fontSize: '0.72rem',
                            bgcolor: typeConfig[log.type].bg,
                            color: typeConfig[log.type].color,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {dayjs(log.startDate).format('MMM D, YYYY')}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          → {dayjs(log.endDate).format('MMM D, YYYY')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={log.serviceDescription} arrow>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: 180,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {log.serviceDescription}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setSelectedLog(log);
                              editForm.reset(log);
                            }}
                            sx={{ color: '#004aad' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => setLogToDelete(log.id)}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {filteredLogs.length > 0 && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Showing {filteredLogs.length} of {logs.length} records
            </Typography>
          )}
        </Grid>
      </Grid>


      <Dialog
        open={Boolean(selectedLog)}
        onClose={() => setSelectedLog(null)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { borderRadius: 3 },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Edit Service Log</Typography>
          <IconButton size="small" onClick={() => setSelectedLog(null)}>
            <Close />
          </IconButton>
        </DialogTitle>
        <Box
          component="form"
          noValidate
          onSubmit={editForm.handleSubmit((data) => {
            if (!selectedLog) return;
            dispatch(updateLog({ ...data, id: selectedLog.id } as ServiceLog));
            setSelectedLog(null);
          })}
        >
          <DialogContent dividers>
            <Stack spacing={2}>
              <TextField {...editForm.register('providerId')} label="Provider ID" fullWidth size="small" error={!!editForm.formState.errors.providerId} helperText={editForm.formState.errors.providerId?.message} />
              <TextField {...editForm.register('serviceOrder')} label="Service Order" fullWidth size="small" error={!!editForm.formState.errors.serviceOrder} helperText={editForm.formState.errors.serviceOrder?.message} />
              <TextField {...editForm.register('carId')} label="Car ID" fullWidth size="small" error={!!editForm.formState.errors.carId} helperText={editForm.formState.errors.carId?.message} />
              <TextField {...editForm.register('type')} select label="Type" fullWidth size="small" defaultValue={selectedLog?.type || 'planned'}>
                <MenuItem value="planned">🟢 Planned</MenuItem>
                <MenuItem value="unplanned">🟠 Unplanned</MenuItem>
                <MenuItem value="emergency">🔴 Emergency</MenuItem>
              </TextField>
              <Stack direction="row" spacing={1}>
                <TextField 
                  {...editForm.register('odometer')} 
                  label="Odometer (mi)" 
                  type="number" 
                  fullWidth 
                  size="small" 
                  slotProps={{ htmlInput: { min: 0 } }}
                  error={!!editForm.formState.errors.odometer} 
                />
                <TextField 
                  {...editForm.register('engineHours')} 
                  label="Engine Hours" 
                  type="number" 
                  fullWidth 
                  size="small" 
                  slotProps={{ htmlInput: { min: 0 } }}
                  error={!!editForm.formState.errors.engineHours} 
                />
              </Stack>
              <Stack direction="row" spacing={1}>
                <TextField 
                  {...editForm.register('startDate')} 
                  type="date" 
                  label="Start" 
                  fullWidth 
                  size="small" 
                  slotProps={{ inputLabel: { shrink: true } }} 
                />
                <TextField 
                  {...editForm.register('endDate')} 
                  type="date" 
                  label="End" 
                  fullWidth 
                  size="small" 
                  slotProps={{ 
                    inputLabel: { shrink: true },
                    htmlInput: { min: editForm.watch('startDate') ? dayjs(editForm.watch('startDate')).add(1, 'day').format('YYYY-MM-DD') : undefined }
                  }} 
                />
              </Stack>
              <TextField {...editForm.register('serviceDescription')} label="Description" multiline rows={3} fullWidth error={!!editForm.formState.errors.serviceDescription} helperText={editForm.formState.errors.serviceDescription?.message} />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setSelectedLog(null)} sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              sx={{ borderRadius: 2, fontWeight: 700, bgcolor: '#004aad', '&:hover': { bgcolor: '#003380' } }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* ── Підтвердження видалення логу ── */}
      <Dialog open={Boolean(logToDelete)} onClose={() => setLogToDelete(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Service Log?</DialogTitle>
        <DialogContent dividers>
          <Typography>Are you sure you want to permanently delete this record? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setLogToDelete(null)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => {
            if (logToDelete) dispatch(deleteLog(logToDelete));
            setLogToDelete(null);
          }} sx={{ borderRadius: 2, fontWeight: 700 }}>Delete</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showClearConfirm} onClose={() => setShowClearConfirm(false)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Clear All Drafts?</DialogTitle>
        <DialogContent dividers>
          <Typography>This will remove all your unsaved drafts. Continue?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setShowClearConfirm(false)} sx={{ borderRadius: 2 }}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => {
            dispatch(clearAllDrafts());
            setShowClearConfirm(false);
          }} sx={{ borderRadius: 2, fontWeight: 700 }}>Clear All</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}