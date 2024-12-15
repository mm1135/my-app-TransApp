import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Grid,
  Chip,
  TextField,
} from '@mui/material';
import { VolumeUp, Star, StarBorder } from '@mui/icons-material';

interface VocabularyWord {
  id: number;
  word: string;
  meaning: string;
  pronunciation: string;
  examples: string[];
  isFavorite: boolean;
}

const VocabularyList: React.FC = () => {
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleFavorite = (id: number) => {
    setWords(words.map(word =>
      word.id === id ? { ...word, isFavorite: !word.isFavorite } : word
    ));
  };

  return (
    <Box sx={{ p: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="単語を検索..."
        value={searchTerm}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      <Grid container spacing={2}>
        {words.map((word) => (
          <Grid item xs={12} sm={6} md={4} key={word.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">{word.word}</Typography>
                  <Box>
                    <IconButton size="small">
                      <VolumeUp />
                    </IconButton>
                    <IconButton
                      size="small"
                      onClick={() => toggleFavorite(word.id)}
                    >
                      {word.isFavorite ? <Star color="primary" /> : <StarBorder />}
                    </IconButton>
                  </Box>
                </Box>

                <Typography color="textSecondary" gutterBottom>
                  {word.pronunciation}
                </Typography>

                <Typography variant="body1" sx={{ mt: 1 }}>
                  {word.meaning}
                </Typography>

                <Box sx={{ mt: 2 }}>
                  {word.examples.map((example, index) => (
                    <Typography
                      key={index}
                      variant="body2"
                      color="textSecondary"
                      sx={{ mt: 1 }}
                    >
                      {example}
                    </Typography>
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default VocabularyList; 